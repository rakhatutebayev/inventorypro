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


class LabelRequest(BaseModel):
    asset_id: int
    size: Literal["30x20", "40x30", "20x30", "30x40"] = "30x20"


def generate_qr_code(data: str) -> BytesIO:
    """Генерирует QR код и возвращает его как BytesIO"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
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

    # Layout
    padding = 1.5 * mm

    # Левый блок - QR код (30% ширины по ТЗ)
    qr_block_w = width * 0.30
    qr_block_h = height

    # Правая часть - текст (Vendor/Model, SN, INV) без переноса
    text_block_x = qr_block_w + padding
    text_block_w = width - qr_block_w - 2 * padding

    # Генерируем QR код (данные = inventory_number)
    qr_data = asset.inventory_number
    qr_img_io = generate_qr_code(qr_data)
    
    # Размещаем QR код в левом блоке (квадрат внутри блока)
    qr_size = min(qr_block_w - 2 * padding, qr_block_h - 2 * padding)
    qr_size = max(qr_size, 1 * mm)
    qr_x = padding + (qr_block_w - 2 * padding - qr_size) / 2
    qr_y = padding + (qr_block_h - 2 * padding - qr_size) / 2

    qr_img = ImageReader(qr_img_io)

    c.drawImage(qr_img, qr_x, qr_y, width=qr_size, height=qr_size, preserveAspectRatio=True, anchor="c")

    # Текст без переноса: Vendor/Model, SN, INV
    vendor_model = f"{asset.vendor} {asset.model}".strip()
    sn_text = f"SN: {asset.serial_number}".strip()
    inv_text = f"INV: {asset.inventory_number}".strip()

    # Подбор размеров шрифта, чтобы всё гарантированно помещалось (без переноса)
    if canonical_size == "30x20":
        title_max, title_min = 9, 6
        text_max, text_min = 7, 5
        line_gap = 1.0 * mm
    else:  # 40x30
        title_max, title_min = 13, 9
        text_max, text_min = 10, 7
        line_gap = 1.2 * mm

    title_font = "Helvetica-Bold"
    text_font = "Helvetica"

    title_size = title_max
    text_size = text_max

    # Пробуем уменьшать шрифты, пока не влезем по высоте (ширину добьём truncation'ом)
    max_text_area_h = height - 2 * padding
    while True:
        needed_h = title_size + line_gap + text_size + line_gap + text_size
        if needed_h <= max_text_area_h:
            break
        if title_size > title_min:
            title_size -= 1
        if text_size > text_min:
            text_size -= 1
        if title_size == title_min and text_size == text_min:
            break

    # Теперь гарантируем ширину через обрезание (без переноса)
    vendor_model_fit = truncate_to_width(c, vendor_model, title_font, title_size, text_block_w)
    sn_fit = truncate_to_width(c, sn_text, text_font, text_size, text_block_w)
    inv_fit = truncate_to_width(c, inv_text, text_font, text_size, text_block_w)

    # Печать текста (сверху вниз)
    y = height - padding - title_size
    c.setFont(title_font, title_size)
    c.drawString(text_block_x, y, vendor_model_fit)

    y -= (line_gap + text_size)
    c.setFont(text_font, text_size)
    c.drawString(text_block_x, y, sn_fit)

    y -= (line_gap + text_size)
    c.drawString(text_block_x, y, inv_fit)
    
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


