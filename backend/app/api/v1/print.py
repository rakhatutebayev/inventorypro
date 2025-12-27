from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.asset import Asset
from app.api.deps import get_current_active_user
import qrcode
from reportlab.lib.pagesizes import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from pydantic import BaseModel
from typing import Literal

router = APIRouter()

# Размеры наклеек (ширина x высота) в мм.
# Важно: по ТЗ ширина должна быть больше высоты (альбомная ориентация):
# - 30x20
# - 40x30
#
# Для обратной совместимости поддерживаем старые значения "20x30" и "30x40",
# но они маппятся на новые альбомные форматы.
LABEL_SIZES = {
    # Canonical (landscape)
    "30x20": (30 * mm, 20 * mm),
    "40x30": (40 * mm, 30 * mm),
    # Backward-compatible aliases
    "20x30": (30 * mm, 20 * mm),  # раньше было "20x30" (портрет), теперь печатаем как 30x20
    "30x40": (40 * mm, 30 * mm),  # раньше было "30x40" (портрет), теперь печатаем как 40x30
}


def normalize_label_size(size: str) -> str:
    """Нормализует размер наклейки к каноническому формату."""
    if size == "20x30":
        return "30x20"
    if size == "30x40":
        return "40x30"
    return size


def truncate_to_width(c: canvas.Canvas, text: str, font_name: str, font_size: int, max_width: float) -> str:
    """Обрезает строку с '...' так, чтобы она гарантированно помещалась по ширине."""
    if c.stringWidth(text, font_name, font_size) <= max_width:
        return text

    ellipsis = "..."
    if c.stringWidth(ellipsis, font_name, font_size) > max_width:
        return ""  # совсем некуда

    # Бинарный поиск по длине
    lo, hi = 0, len(text)
    best = ellipsis
    while lo <= hi:
        mid = (lo + hi) // 2
        candidate = text[:mid] + ellipsis
        if c.stringWidth(candidate, font_name, font_size) <= max_width:
            best = candidate
            lo = mid + 1
        else:
            hi = mid - 1
    return best


def wrap_to_width(
    c: canvas.Canvas,
    text: str,
    font_name: str,
    font_size: int,
    max_width: float,
    max_lines: int = 2,
) -> list[str]:
    """
    Переносит строку по ширине (для S/N как на макете).
    Важно: НЕ использует '...' (по ТЗ).
    """
    text = (text or "").strip()
    if not text:
        return []

    # Быстрый путь: всё влезает в одну строку
    if c.stringWidth(text, font_name, font_size) <= max_width:
        return [text]

    # Токенизация: сначала по пробелам, затем длинные куски режем по '-'
    raw_parts = text.split()
    parts: list[str] = []
    for p in raw_parts:
        if c.stringWidth(p, font_name, font_size) <= max_width:
            parts.append(p)
            continue
        # если токен слишком длинный — дробим по '-'
        if "-" in p:
            sub = p.split("-")
            for i, s in enumerate(sub):
                if s:
                    parts.append(s + ("-" if i < len(sub) - 1 else ""))
        else:
            parts.append(p)

    lines: list[str] = []
    cur = ""

    def flush():
        nonlocal cur
        if cur:
            lines.append(cur)
            cur = ""

    for token in parts:
        candidate = token if not cur else (cur + token)
        if c.stringWidth(candidate, font_name, font_size) <= max_width:
            cur = candidate
            continue

        # если текущая строка пустая — token сам по себе не лезет, режем по символам
        if not cur:
            # бинарный поиск по длине
            lo, hi = 1, len(token)
            best = token[0]
            while lo <= hi:
                mid = (lo + hi) // 2
                cand = token[:mid]
                if c.stringWidth(cand, font_name, font_size) <= max_width:
                    best = cand
                    lo = mid + 1
                else:
                    hi = mid - 1
            cur = best
            flush()
            # остаток токена игнорируем, будет в следующей итерации если надо
            rest = token[len(best):]
            if rest:
                parts.insert(0, rest)
            continue

        flush()
        cur = token

        if len(lines) >= max_lines:
            break

    flush()

    # Ограничение по числу строк + ellipsis на последней
    if len(lines) > max_lines:
        lines = lines[:max_lines]

    return lines


def wrap_to_width_with_status(
    c: canvas.Canvas,
    text: str,
    font_name: str,
    font_size: int,
    max_width: float,
    max_lines: int,
) -> tuple[list[str], bool]:
    """
    Как wrap_to_width, но возвращает флаг complete=True если весь текст уместился.
    Важно: НЕ добавляет '...'.
    """
    text = (text or "").strip()
    if not text:
        return ([], True)

    lines = wrap_to_width(c, text, font_name, font_size, max_width, max_lines=max_lines)
    # Проверяем "полноту" грубо: по конкатенации без пробелов (wrap_to_width может вставлять/убирать пробелы)
    joined = "".join(lines).replace(" ", "")
    full = text.replace(" ", "")
    return (lines, joined == full)


class LabelRequest(BaseModel):
    asset_id: int
    size: Literal["30x20", "40x30", "20x30", "30x40"] = "30x20"


def generate_qr_code(data: str) -> BytesIO:
    """Генерирует QR код и возвращает его как BytesIO"""
    qr = qrcode.QRCode(
        # v1–v3 по ТЗ, но оставляем fit=True чтобы при необходимости QR мог вырасти
        # (в PDF мы всё равно масштабируем его в фиксированную область)
        version=None,
        # По ТЗ: Error Correction Level M или Q
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        # Quiet zone важна для читаемости (без рамок/фона)
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img_io = BytesIO()
    img.save(img_io, format='PNG')
    img_io.seek(0)
    return img_io


def generate_label_pdf(asset: Asset, size: str = "30x20") -> BytesIO:
    """Генерирует PDF наклейку для актива"""
    canonical_size = normalize_label_size(size)
    width, height = LABEL_SIZES[canonical_size]
    
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=(width, height))

    # === Новый дизайн (как на примере пользователя) ===
    # Без рамок/фонов, только ч/б. Размеры для 30x20 при 300 DPI:
    # - label: ~354x236 px
    # - QR: 125x125 px  => 0.4167 in => 30 pt => ~10.58 mm
    #
    # Для 40x30 масштабируем пропорционально ширине.
    margin = 1.0 * mm
    gap = 1.0 * mm

    # Шрифты по ТЗ (pt). Roboto требует встраивания TTF, поэтому используем Helvetica.
    if canonical_size == "30x20":
        name_size = 6
        sn_size_target = 4
        inv_size = 7
        qr_px = 125
    else:  # 40x30
        # Масштабируем относительно ширины (40/30 = 1.333...)
        scale = float(width / (30 * mm))
        name_size = max(6, int(round(6 * scale)))
        sn_size_target = max(4, int(round(4 * scale)))
        inv_size = max(7, int(round(7 * scale)))
        qr_px = int(round(125 * scale))

    name_font = "Helvetica-Bold"
    sn_font = "Helvetica"
    inv_font = "Helvetica-Bold"

    # QR размер в points: 125px @300dpi => 30pt. Масштабируем для 40x30.
    qr_size_pt = 30.0 * float(width / (30 * mm))

    # QR: по ТЗ 13x13мм для 30x20
    qr_data = asset.inventory_number
    qr_img_io = generate_qr_code(qr_data)
    qr_img = ImageReader(qr_img_io)

    # Позиции
    qr_x = margin
    qr_y = margin
    qr_size = min(qr_size_pt, height - 2 * margin, width - 2 * margin)

    # Рисуем QR
    c.setFillColor(colors.black)
    c.drawImage(qr_img, qr_x, qr_y, width=qr_size, height=qr_size, preserveAspectRatio=True)

    # Заголовок (Vendor + Model) — 1 строка, без переноса, без "..."
    name_text = f"{asset.vendor} {asset.model}".strip()
    name_x = margin
    name_y = height - margin - name_size
    name_w = width - 2 * margin
    cur_name_size = name_size
    c.setFont(name_font, cur_name_size)
    while cur_name_size > 3 and c.stringWidth(name_text, name_font, cur_name_size) > name_w:
        cur_name_size -= 1
        c.setFont(name_font, cur_name_size)
        name_y = height - margin - cur_name_size
    c.drawString(name_x, name_y, name_text)

    # Инвентарный номер (внизу справа), 1 строка, 7pt, без "..."
    inv_text = (asset.inventory_number or "").strip()
    inv_x_right = width - margin
    inv_y = margin
    cur_inv_size = inv_size
    c.setFont(inv_font, cur_inv_size)
    while cur_inv_size > 4 and c.stringWidth(inv_text, inv_font, cur_inv_size) > (width - 2 * margin - (qr_size + gap)):
        cur_inv_size -= 1
        c.setFont(inv_font, cur_inv_size)
    c.drawRightString(inv_x_right, inv_y, inv_text)

    # Серийный номер (справа от QR), переносимый, шрифт 4pt (может уменьшаться, чтобы всё влезло по высоте)
    serial_raw = (asset.serial_number or "").strip()
    serial_x = qr_x + qr_size + gap
    serial_w = width - margin - serial_x
    # Вертикальная область для serial: между заголовком и инвентарным номером
    serial_top = name_y - gap
    serial_bottom = inv_y + cur_inv_size + gap
    serial_h = max(serial_top - serial_bottom, 1 * mm)

    # Подбор строк/шрифта: без '...', переносы разрешены
    leading_gap = 0.6  # pt
    sn_size = sn_size_target
    min_sn_size = 3
    max_lines_cap = 6  # чтобы не уйти в "мелкий текст", но при необходимости уменьшится шрифт

    while True:
        c.setFont(sn_font, sn_size)
        leading = sn_size + leading_gap
        max_lines_fit = max(1, int((serial_h + leading_gap) // leading))
        max_lines_fit = min(max_lines_fit, max_lines_cap)
        lines, complete = wrap_to_width_with_status(c, serial_raw, sn_font, sn_size, serial_w, max_lines=max_lines_fit)

        total_h = len(lines) * leading - leading_gap if lines else leading
        if complete and total_h <= serial_h:
            break
        if sn_size <= min_sn_size:
            break
        sn_size -= 1

    # Рисуем serial сверху вниз
    c.setFont(sn_font, sn_size)
    leading = sn_size + leading_gap
    y = serial_top - sn_size
    for line in lines:
        c.drawString(serial_x, y, line)
        y -= leading
    
    c.save()
    buffer.seek(0)
    return buffer


@router.post("/label")
def create_label(
    label_request: LabelRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    asset = db.query(Asset).filter(Asset.id == label_request.asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    pdf_buffer = generate_label_pdf(asset, label_request.size)
    
    return Response(
        content=pdf_buffer.read(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=label_{asset.inventory_number}_{label_request.size}.pdf"
        }
    )


@router.get("/label/{asset_id}/{size}")
def get_label(
    asset_id: int,
    size: Literal["30x20", "40x30", "20x30", "30x40"] = "30x20",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    if size not in LABEL_SIZES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid size. Must be one of: {', '.join(LABEL_SIZES.keys())}"
        )
    
    pdf_buffer = generate_label_pdf(asset, size)
    
    return Response(
        content=pdf_buffer.read(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=label_{asset.inventory_number}_{size}.pdf"
        }
    )


