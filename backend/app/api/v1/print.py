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
    
    # Левый блок - QR код (50% ширины)
    qr_width = width * 0.5
    qr_height = height
    
    # Генерируем QR код с inventory_number
    qr_data = asset.inventory_number
    qr_img_io = generate_qr_code(qr_data)
    
    # Размещаем QR код в левом блоке
    qr_img = ImageReader(qr_img_io)
    c.drawImage(qr_img, 0, 0, width=qr_width, height=qr_height, preserveAspectRatio=True)
    
    # Правый блок - текст (50% ширины)
    text_x = qr_width + 2*mm  # Небольшой отступ
    text_y = height - 3*mm    # Отступ сверху
    text_width = width - qr_width - 4*mm
    
    # Font sizes based on label size (canonical)
    if canonical_size == "30x20":
        title_font_size = 8
        text_font_size = 6
    else:  # 40x30
        title_font_size = 12
        text_font_size = 9
    
    # Vendor + Model
    vendor_model = f"{asset.vendor} {asset.model}"
    c.setFont("Helvetica-Bold", title_font_size)
    # Разбиваем длинные строки
    lines = []
    words = vendor_model.split()
    current_line = ""
    for word in words:
        test_line = f"{current_line} {word}" if current_line else word
        if c.stringWidth(test_line, "Helvetica-Bold", title_font_size) < text_width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)
    
    y_pos = text_y
    for line in lines[:2]:  # Максимум 2 строки для Vendor+Model
        c.drawString(text_x, y_pos, line[:30])  # Обрезаем если слишком длинное
        y_pos -= title_font_size + 2*mm
    
    # Serial Number
    y_pos -= 2*mm
    c.setFont("Helvetica", text_font_size)
    serial_text = f"Serial: {asset.serial_number}"
    # Обрезаем если слишком длинное
    if c.stringWidth(serial_text, "Helvetica", text_font_size) > text_width:
        serial_text = serial_text[:25] + "..."
    c.drawString(text_x, y_pos, serial_text)
    
    # Inventory Number
    y_pos -= text_font_size + 1*mm
    inv_text = f"INV: {asset.inventory_number}"
    c.drawString(text_x, y_pos, inv_text)
    
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


