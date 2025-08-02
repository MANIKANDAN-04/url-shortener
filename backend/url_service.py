import string
import random
import qrcode
import base64
import redis
import os
from io import BytesIO
from datetime import datetime, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session
from database import URL, Analytics, get_current_time_ist
import logging

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(REDIS_URL)

def generate_random_short_code(length=6):
    """Generate a random short code for URLs"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def create_qr_code_image(url: str) -> str:
    """Generate QR code for URL and return as base64 string"""
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        qr_image = qr.make_image(fill_color="black", back_color="white")
        
        buffer = BytesIO()
        qr_image.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_base64}"
    except Exception as e:
        logger.error(f"Failed to generate QR code: {e}")
        return None

def create_short_url(original_url: str, user_id: int, custom_code: str = None, 
                    expires_in_days: int = None, db: Session = None) -> URL:
    """Create a new short URL"""
    
    existing_url = db.query(URL).filter(URL.original_url == original_url, URL.user_id == user_id).first()
    if existing_url and existing_url.is_active:
        return existing_url
    
    if custom_code:
        short_code = custom_code
        existing_code = db.query(URL).filter(URL.short_code == short_code, URL.is_active == True).first()
        if existing_code:
            raise HTTPException(status_code=400, detail=f"Short code '{custom_code}' is already taken")
    else:
        short_code = generate_random_short_code()
        while db.query(URL).filter(URL.short_code == short_code, URL.is_active == True).first():
            short_code = generate_random_short_code()
    
    expires_at = None
    if expires_in_days:
        expires_at = get_current_time_ist() + timedelta(days=expires_in_days)
    
    short_url = f"http://localhost:8080/{short_code}"
    qr_code_data = create_qr_code_image(short_url)
    
    url_record = URL(
        original_url=original_url,
        short_code=short_code,
        expires_at=expires_at,
        qr_code=qr_code_data,
        user_id=user_id
    )
    
    db.add(url_record)
    db.commit()
    db.refresh(url_record)
    
    return url_record

def get_user_urls(user_id: int, skip: int = 0, limit: int = 100, db: Session = None):
    """Get paginated list of user's URLs"""
    urls = db.query(URL).filter(
        URL.user_id == user_id, 
        URL.is_active == True
    ).order_by(URL.created_at.desc()).offset(skip).limit(limit).all()
    
    return urls

def soft_delete_url(short_code: str, user_id: int, db: Session = None):
    """Soft delete URL with 2-day backup period"""
    url_record = db.query(URL).filter(
        URL.short_code == short_code,
        URL.user_id == user_id,
        URL.is_active == True
    ).first()
    
    if not url_record:
        raise HTTPException(status_code=404, detail="URL not found")
    
    now = get_current_time_ist()
    backup_until = now + timedelta(days=2)
    
    url_record.is_active = False
    url_record.deleted_at = now
    url_record.backup_until = backup_until
    
    db.commit()
    
    return backup_until

def record_url_click(short_code: str, user_agent: str, referer: str, db: Session = None):
    """Record analytics data for URL click"""
    try:
        url_record = db.query(URL).filter(URL.short_code == short_code).first()
        if url_record:
            url_record.click_count += 1
            
            analytics_record = Analytics(
                short_code=short_code,
                user_agent=user_agent,
                referer=referer,
                clicked_at=get_current_time_ist()
            )
            db.add(analytics_record)
            db.commit()
            
            try:
                url_list_keys = redis_client.keys("urls_list:*")
                if url_list_keys:
                    redis_client.delete(*url_list_keys)
                
                analytics_key = f"analytics:{short_code}"
                redis_client.delete(analytics_key)
                
                logger.info(f"Invalidated caches after click on {short_code}")
            except Exception as cache_error:
                logger.warning(f"Failed to invalidate cache: {cache_error}")
            
            logger.info(f"Recorded click for {short_code}")
    except Exception as e:
        logger.error(f"Failed to record click for {short_code}: {e}")
