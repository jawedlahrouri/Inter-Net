from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum("user", "admin", name="user_roles"), default="user", nullable=False)
    settings = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    services = relationship("UserService", back_populates="user", cascade="all, delete-orphan")
    widgets = relationship("UserWidget", back_populates="user", cascade="all, delete-orphan")

