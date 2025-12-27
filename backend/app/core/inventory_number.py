from sqlalchemy.orm import Session
from app.models.asset import Asset
import re


def generate_inventory_number(
    db: Session,
    company_code: str,
    device_type_code: str
) -> str:
    """
    Генерирует следующий инвентарный номер для комбинации company_code + device_type_code
    Формат: WWP-01/0030
    """
    # Формируем префикс: COMPANY_CODE-DEVICE_TYPE_CODE/
    prefix = f"{company_code}-{device_type_code}/"
    
    # Ищем последний номер для этой комбинации
    pattern = f"^{re.escape(prefix)}\\d{{4}}$"
    
    # Получаем все активы с таким префиксом
    assets = db.query(Asset).filter(
        Asset.inventory_number.like(f"{prefix}%")
    ).all()
    
    # Извлекаем номера и находим максимальный
    max_number = 0
    for asset in assets:
        # Извлекаем числовую часть (последние 4 цифры после слеша)
        number_part = asset.inventory_number.split('/')[-1]
        try:
            num = int(number_part)
            if num > max_number:
                max_number = num
        except ValueError:
            continue
    
    # Генерируем следующий номер
    next_number = max_number + 1
    
    # Проверяем, что не превышен лимит 9999
    if next_number > 9999:
        raise ValueError(f"Maximum number of assets reached for {prefix}")
    
    # Форматируем номер с ведущими нулями
    inventory_number = f"{prefix}{next_number:04d}"
    
    return inventory_number


def validate_inventory_number_format(inventory_number: str) -> bool:
    """
    Валидирует формат инвентарного номера: WWP-01/0030
    """
    pattern = r'^[A-Z]{3}-\d{2}/\d{4}$'
    return bool(re.match(pattern, inventory_number))


