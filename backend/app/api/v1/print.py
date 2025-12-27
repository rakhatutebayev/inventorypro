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

    # === Макет как на примере (рамка + разделители) ===
    # Важно: units ReportLab — points; мы используем mm для точных размеров.
    outer_margin = 0.8 * mm
    padding = 1.2 * mm
    corner_radius = 2.0 * mm

    x0, y0 = outer_margin, outer_margin
    content_w = width - 2 * outer_margin
    content_h = height - 2 * outer_margin

    # Рамка (скруглённая)
    c.setStrokeColor(colors.black)
    c.setLineWidth(0.35 * mm)
    c.setFillColor(colors.white)
    c.roundRect(x0, y0, content_w, content_h, corner_radius, stroke=1, fill=0)
    # Важно: после рамки возвращаем цвет заливки в чёрный, иначе текст будет белым на белом
    c.setFillColor(colors.black)

    # Левый блок QR ~40% ширины
    qr_block_w = content_w * 0.40
    div_x = x0 + qr_block_w

    # Вертикальный разделитель
    c.setLineWidth(0.25 * mm)
    c.line(div_x, y0 + padding, div_x, y0 + content_h - padding)

    # Правая область текста ~60%
    text_x = div_x + padding
    text_w = x0 + content_w - padding - text_x

    # QR: по ТЗ 13x13мм для 30x20
    qr_data = asset.inventory_number
    qr_img_io = generate_qr_code(qr_data)
    
    # Размер QR по макету
    if canonical_size == "30x20":
        target_qr_mm = 13 * mm
    else:
        target_qr_mm = 18 * mm

    qr_size = min(target_qr_mm, qr_block_w - 2 * padding, content_h - 2 * padding)
    qr_size = max(qr_size, 10 * mm)
    qr_x = x0 + padding + (qr_block_w - 2 * padding - qr_size) / 2
    qr_y = y0 + padding + (content_h - 2 * padding - qr_size) / 2

    qr_img = ImageReader(qr_img_io)
    c.drawImage(qr_img, qr_x, qr_y, width=qr_size, height=qr_size, preserveAspectRatio=True)

    # Текст как на картинке: Vendor/Model (bold), затем блок S/N (в 2 строки), затем Inv. No
    vendor_model = f"{asset.vendor} {asset.model}".strip()
    serial_raw = (asset.serial_number or "").strip()
    inv_no = (asset.inventory_number or "").strip()

    # Шрифты (Roboto по ТЗ — пока Helvetica, если нужно строго Roboto, добавим TTF)
    if canonical_size == "30x20":
        vm_size_target = 10
        sn_size_target = 8
        inv_size_target = 9
        line_gap = 0.8 * mm
        rule_gap = 1.2 * mm
        max_serial_lines = 2
    else:  # 40x30
        vm_size_target = 14
        sn_size_target = 11
        inv_size_target = 12
        line_gap = 1.0 * mm
        rule_gap = 1.6 * mm
        max_serial_lines = 2

    vm_font = "Helvetica-Bold"
    sn_font = "Helvetica"
    inv_label_font = "Helvetica"
    inv_value_font = "Helvetica-Bold"

    # === Секции по высоте (как в примере): Vendor / SN / INV ===
    # Делаем фиксированные секции по пропорциям, чтобы SN гарантированно имел свою "область"
    vendor_section_h = content_h * 0.32
    inv_section_h = content_h * 0.26
    sn_section_h = content_h - vendor_section_h - inv_section_h

    top_y = y0 + content_h - padding
    vendor_top = y0 + content_h
    vendor_bottom = vendor_top - vendor_section_h
    inv_bottom = y0
    inv_top = inv_bottom + inv_section_h
    sn_top = vendor_bottom
    sn_bottom = inv_top

    # Линии-разделители секций
    c.setLineWidth(0.25 * mm)
    y_rule1 = vendor_bottom
    y_rule2 = inv_top
    c.line(text_x, y_rule1, text_x + text_w, y_rule1)
    c.line(text_x, y_rule2, text_x + text_w, y_rule2)

    # --- Vendor/Model (1 строка, без '...': уменьшаем шрифт, пока не влезет) ---
    vm_size = vm_size_target
    c.setFont(vm_font, vm_size)
    while vm_size > 6 and c.stringWidth(vendor_model, vm_font, vm_size) > text_w:
        vm_size -= 1
        c.setFont(vm_font, vm_size)

    # Вертикально центрируем в секции Vendor
    y_vm = vendor_bottom + (vendor_section_h - vm_size) / 2
    c.setFont(vm_font, vm_size)
    c.drawString(text_x, y_vm, vendor_model)

    # --- Блок S/N: может переноситься, без '...' ---
    sn_prefix = "S/N:"
    prefix_gap = 1.2 * mm
    sn_prefix_w = c.stringWidth(sn_prefix, sn_font, sn_size_target) + prefix_gap
    sn_text_w = max(text_w - sn_prefix_w, 1 * mm)

    # Подбор размера шрифта для SN:
    # - допускаем перенос на несколько строк
    # - обязательно влезть по высоте SN-секции
    sn_size = sn_size_target
    min_sn_size = 5 if canonical_size == "30x20" else 7

    while True:
        c.setFont(sn_font, sn_size)
        # сколько строк реально помещается по высоте SN секции
        max_lines_fit = max(1, int((sn_section_h - 2 * padding + line_gap) // (sn_size + line_gap)))
        max_lines_fit = min(max_lines_fit, 3)  # визуально как на макете (обычно 2), максимум 3

        serial_lines = wrap_to_width(c, serial_raw, sn_font, sn_size, sn_text_w, max_lines=max_lines_fit)

        # Проверим что весь serial вошёл: если последний символ последней строки
        # не соответствует концу serial_raw, значит не уместилось в max_lines_fit.
        joined = "".join(serial_lines).replace(" ", "")
        full = serial_raw.replace(" ", "")

        height_ok = (len(serial_lines) * sn_size + (max(0, len(serial_lines) - 1) * line_gap)) <= (sn_section_h - 2 * padding)
        full_ok = joined == full

        if height_ok and full_ok:
            break

        if sn_size <= min_sn_size:
            # Последний шанс: разрешим больше строк, если по высоте влезет
            # (но без переполнения секции)
            max_lines_fit = max(1, int((sn_section_h - 2 * padding + line_gap) // (sn_size + line_gap)))
            serial_lines = wrap_to_width(c, serial_raw, sn_font, sn_size, sn_text_w, max_lines=max_lines_fit)
            break

        sn_size -= 1

    # Рисуем S/N строки внутри SN секции (сверху вниз)
    y = sn_top - padding - sn_size
    c.setFont(sn_font, sn_size)
    if serial_lines:
        c.drawString(text_x, y, sn_prefix)
        c.drawString(text_x + sn_prefix_w, y, serial_lines[0])
        for i in range(1, len(serial_lines)):
            y -= (sn_size + line_gap)
            c.drawString(text_x + sn_prefix_w, y, serial_lines[i])
    else:
        c.drawString(text_x, y, sn_prefix)

    # --- Inv. No: 1 строка, без '...': уменьшаем шрифт, пока не влезет ---
    inv_label = "Inv. No:"
    inv_size = inv_size_target
    min_inv_size = 6 if canonical_size == "30x20" else 9

    while True:
        inv_label_w = c.stringWidth(inv_label, inv_label_font, inv_size) + prefix_gap
        inv_value_w = max(text_w - inv_label_w, 1 * mm)
        if c.stringWidth(inv_no, inv_value_font, inv_size) <= inv_value_w:
            break
        if inv_size <= min_inv_size:
            break
        inv_size -= 1

    # Вертикально центрируем в нижней секции
    y_inv = inv_bottom + (inv_section_h - inv_size) / 2
    c.setFont(inv_label_font, inv_size)
    c.drawString(text_x, y_inv, inv_label)
    c.setFont(inv_value_font, inv_size)
    c.drawString(text_x + inv_label_w, y_inv, inv_no)
    
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


