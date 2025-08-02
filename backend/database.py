import os
from datetime import datetime
import pytz
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

IST = pytz.timezone('Asia/Kolkata')

def get_current_time_ist():
    """Get current time in IST timezone"""
    return datetime.now(IST).replace(tzinfo=None)

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://appuser:apppassword@localhost:3306/urlshortener")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_database_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=get_current_time_ist)
    is_active = Column(Boolean, default=True)
    
    urls = relationship("URL", back_populates="user")

class URL(Base):
    __tablename__ = "urls"
    
    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(Text, nullable=False)
    short_code = Column(String(10), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=get_current_time_ist)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    click_count = Column(Integer, default=0)
    deleted_at = Column(DateTime, nullable=True)
    backup_until = Column(DateTime, nullable=True)
    qr_code = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    user = relationship("User", back_populates="urls")

class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    short_code = Column(String(10), nullable=False, index=True)
    user_agent = Column(Text)
    referer = Column(Text)
    clicked_at = Column(DateTime, default=get_current_time_ist)
