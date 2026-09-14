from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.db.session import Base


class WidgetDefinition(Base):
    __tablename__ = "widget_definitions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    params_schema = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    service = relationship("Service", back_populates="widgets")
    instances = relationship("UserWidget", back_populates="widget_def", cascade="all, delete-orphan")


class UserWidget(Base):
    __tablename__ = "user_widgets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    widget_id = Column(Integer, ForeignKey("widget_definitions.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=True)
    params_values = Column(JSON, nullable=False)
    refresh_rate = Column(Integer, default=60, nullable=False)
    position_x = Column(Integer, default=0, nullable=False)
    position_y = Column(Integer, default=0, nullable=False)
    width = Column(Integer, default=1, nullable=False)
    height = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="widgets")
    widget_def = relationship("WidgetDefinition", back_populates="instances")
