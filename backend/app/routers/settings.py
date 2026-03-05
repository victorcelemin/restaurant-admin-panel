from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.settings import AppSettings
from app.models.user import User
from app.schemas.reports import SettingsUpdate
from app.security import require_admin

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/")
def get_settings(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    settings = db.query(AppSettings).all()
    return {s.key: s.value for s in settings}


@router.put("/")
def update_setting(data: SettingsUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    setting = db.query(AppSettings).filter(AppSettings.key == data.key).first()
    if setting:
        setting.value = data.value
    else:
        setting = AppSettings(key=data.key, value=data.value)
        db.add(setting)
    db.commit()
    return {"key": data.key, "value": data.value}
