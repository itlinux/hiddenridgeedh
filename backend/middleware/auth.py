from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from database import get_db, get_settings
from models.schemas import UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    settings = get_settings()
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db = get_db()
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
    if not user.get("is_active"):
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


async def get_approved_user(current_user=Depends(get_current_user)):
    if not current_user.get("is_approved"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval. You will be notified by email once approved."
        )
    return current_user


async def get_content_admin(current_user=Depends(get_approved_user)):
    role = current_user.get("role")
    if role not in [UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Content admin privileges required"
        )
    return current_user


async def get_super_admin(current_user=Depends(get_approved_user)):
    if current_user.get("role") != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin privileges required"
        )
    return current_user
