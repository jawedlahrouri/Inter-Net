from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    identifier: str = Field(..., description="Email ou nom d'utilisateur")
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    role: str
    is_verified: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None


class RegisterResponse(BaseModel):
    message: str
    email: EmailStr
    username: str
    is_verified: bool = False


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=1, description="Jeton de vérification d'email")


class VerifyEmailResponse(BaseModel):
    message: str
    is_verified: bool
    email: Optional[EmailStr] = None


class ResendVerificationRequest(BaseModel):
    email: EmailStr
