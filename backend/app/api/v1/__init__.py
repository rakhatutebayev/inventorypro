from fastapi import APIRouter
from app.api.v1 import auth, assets, movements, inventory, print, reports, references

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(movements.router, prefix="/move", tags=["movements"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(print.router, prefix="/print", tags=["print"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(references.router, prefix="/references", tags=["references"])

