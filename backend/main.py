from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel, HttpUrl, EmailStr
import redis
import json
import os
from datetime import datetime
import logging

from database import get_database_session, User, URL, Analytics, get_current_time_ist
from auth_service import get_logged_in_user, create_user_account, authenticate_user_login
from url_service import create_short_url, get_user_urls, soft_delete_url, record_url_click

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(REDIS_URL)

class UserRegistration(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

class CreateShortURL(BaseModel):
    url: HttpUrl
    custom_code: str = None
    expires_in_days: int = None
    use_existing_code: bool = False

class ShortURLResponse(BaseModel):
    id: int
    original_url: str
    short_code: str
    short_url: str
    created_at: datetime
    expires_at: datetime | None = None
    click_count: int
    is_active: bool = True
    qr_code: str | None = None

class AnalyticsData(BaseModel):
    short_code: str
    total_clicks: int
    click_history: list

app = FastAPI(title="URL Shortener API", version="2.0.0")

app.add_middleware(SessionMiddleware, secret_key="change-this-in-production-please")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {"message": "URL Shortener API is running", "version": "2.0.0"}

@app.post("/api/register", response_model=UserProfile)
async def register_new_user(user_data: UserRegistration, db = Depends(get_database_session)):
    """Register a new user account"""
    try:
        new_user = create_user_account(user_data.name, user_data.email, user_data.password, db)
        
        return UserProfile(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            created_at=new_user.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail="Registration service temporarily unavailable. Please try again later.")

@app.post("/api/login")
async def login_user(user_data: UserLogin, request: Request, db = Depends(get_database_session)):
    """Login user and create session"""
    try:
        user = authenticate_user_login(user_data.email, user_data.password, db)
        
        request.session["user_id"] = user.id
        
        return {
            "message": "Login successful",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(status_code=500, detail="Login service temporarily unavailable. Please try again later.")

@app.post("/api/logout")
async def logout_user(request: Request):
    """Logout user by clearing session"""
    request.session.clear()
    return {"message": "Logout successful"}

@app.get("/api/me", response_model=UserProfile)
async def get_current_user_profile(current_user: User = Depends(get_logged_in_user)):
    """Get current user information"""
    return UserProfile(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        created_at=current_user.created_at
    )

@app.post("/api/check-url")
async def check_url_validity(url_data: CreateShortURL, current_user: User = Depends(get_logged_in_user)):
    """Check if URL is valid and reachable"""
    try:
        import requests
        from urllib.parse import urlparse
        
        original_url = str(url_data.url)
        
        parsed = urlparse(original_url)
        if not parsed.scheme or not parsed.netloc:
            return {"valid": False, "message": "Invalid URL format"}
        
        try:
            response = requests.head(original_url, timeout=5, allow_redirects=True)
            if response.status_code < 400:
                return {"valid": True, "message": "URL is reachable"}
            else:
                return {"valid": False, "message": f"URL returned status {response.status_code}"}
        except requests.exceptions.RequestException:
            return {"valid": True, "message": "URL format is valid (reachability check failed)"}
            
    except Exception as e:
        logger.warning(f"URL check failed: {e}")
        return {"valid": True, "message": "URL format appears valid"}

@app.post("/api/shorten", response_model=ShortURLResponse)
async def shorten_new_url(url_data: CreateShortURL, current_user: User = Depends(get_logged_in_user), 
                         db = Depends(get_database_session)):
    """Create a new short URL"""
    try:
        original_url = str(url_data.url)
        
        url_record = create_short_url(
            original_url=original_url,
            user_id=current_user.id,
            custom_code=url_data.custom_code,
            expires_in_days=url_data.expires_in_days,
            db=db
        )
        
        redis_client.setex(f"short:{url_record.short_code}", 3600, original_url)
        
        try:
            cache_keys = redis_client.keys("urls_list:*")
            if cache_keys:
                redis_client.delete(*cache_keys)
        except Exception as cache_error:
            logger.warning(f"Cache invalidation failed: {cache_error}")
        
        return ShortURLResponse(
            id=url_record.id,
            original_url=url_record.original_url,
            short_code=url_record.short_code,
            short_url=f"http://localhost:8080/{url_record.short_code}",
            created_at=url_record.created_at,
            expires_at=url_record.expires_at,
            click_count=url_record.click_count,
            is_active=True,
            qr_code=url_record.qr_code
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL shortening failed: {e}")
        raise HTTPException(status_code=500, detail="URL shortening service unavailable")

@app.get("/{short_code}")
async def redirect_to_original_url(short_code: str, request: Request, db = Depends(get_database_session)):
    """Redirect short URL to original URL"""
    try:
        cached_url = redis_client.get(f"short:{short_code}")
        original_url = None
        
        if cached_url:
            original_url = cached_url.decode('utf-8')
        else:
            url_record = db.query(URL).filter(URL.short_code == short_code, URL.is_active == True).first()
            if not url_record:
                raise HTTPException(status_code=404, detail="Short URL not found")
            
            if url_record.expires_at and url_record.expires_at < get_current_time_ist():
                raise HTTPException(status_code=410, detail="This URL has expired")
            
            original_url = url_record.original_url
            
            redis_client.setex(f"short:{short_code}", 3600, original_url)
        
        try:
            user_agent = request.headers.get("user-agent", "")
            referer = request.headers.get("referer", "")
            record_url_click(short_code, user_agent, referer, db)
        except Exception as analytics_error:
            logger.error(f"Analytics recording failed: {analytics_error}")
        
        return RedirectResponse(url=original_url, status_code=302)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Redirect failed for {short_code}: {e}")
        raise HTTPException(status_code=500, detail="Redirect service unavailable")

@app.get("/api/urls")
async def list_user_urls(skip: int = 0, limit: int = 100, current_user: User = Depends(get_logged_in_user), 
                        db = Depends(get_database_session)):
    """Get paginated list of user's URLs"""
    try:
        cache_key = f"urls_list:{current_user.id}:{skip}:{limit}"
        
        try:
            cached_result = redis_client.get(cache_key)
            if cached_result:
                logger.info("Returning cached URL list")
                return json.loads(cached_result.decode('utf-8'))
        except Exception as redis_error:
            logger.warning(f"Redis error: {redis_error}")
        
        urls = get_user_urls(current_user.id, skip, limit, db)
        
        result = []
        for url in urls:
            result.append({
                'id': url.id,
                'original_url': url.original_url,
                'short_code': url.short_code,
                'short_url': f"http://localhost:8080/{url.short_code}",
                'created_at': url.created_at.isoformat(),
                'click_count': url.click_count,
                'qr_code': url.qr_code
            })
        
        try:
            redis_client.setex(cache_key, 10, json.dumps(result))
        except Exception as redis_error:
            logger.warning(f"Failed to cache URL list: {redis_error}")
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to list URLs: {e}")
        raise HTTPException(status_code=500, detail="Could not load URLs")

@app.delete("/api/urls/{short_code}")
async def delete_user_url(short_code: str, current_user: User = Depends(get_logged_in_user), 
                         db = Depends(get_database_session)):
    """Soft delete a URL with backup period"""
    try:
        backup_until = soft_delete_url(short_code, current_user.id, db)
        
        redis_client.delete(f"short:{short_code}")
        
        try:
            cache_keys = redis_client.keys("urls_list:*")
            if cache_keys:
                redis_client.delete(*cache_keys)
        except Exception as cache_error:
            logger.warning(f"Cache invalidation failed: {cache_error}")
        
        return {
            "message": "URL deleted successfully", 
            "backup_until": backup_until.isoformat(),
            "note": "URL will be permanently removed after 2 days"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete failed for {short_code}: {e}")
        raise HTTPException(status_code=500, detail="Delete operation failed")

@app.get("/api/analytics/{short_code}", response_model=AnalyticsData)
async def get_url_analytics(short_code: str, current_user: User = Depends(get_logged_in_user), 
                           db = Depends(get_database_session)):
    """Get analytics for a specific URL"""
    try:
        url_record = db.query(URL).filter(URL.short_code == short_code, URL.user_id == current_user.id).first()
        if not url_record:
            raise HTTPException(status_code=404, detail="URL not found")
        
        cache_key = f"analytics:{short_code}"
        cached_analytics = redis_client.get(cache_key)
        
        if cached_analytics:
            analytics_data = json.loads(cached_analytics)
        else:
            analytics_records = db.query(Analytics).filter(
                Analytics.short_code == short_code
            ).order_by(Analytics.clicked_at.desc()).limit(100).all()
            
            click_history = []
            for record in analytics_records:
                click_history.append({
                    'timestamp': record.clicked_at.isoformat() if record.clicked_at else None,
                    'date': record.clicked_at.strftime('%Y-%m-%d') if record.clicked_at else None,
                    'time': record.clicked_at.strftime('%H:%M:%S') if record.clicked_at else None,
                    'user_agent': record.user_agent or 'Unknown',
                    'referer': record.referer or 'Direct'
                })
            
            analytics_data = {
                'total_clicks': url_record.click_count,
                'click_history': click_history
            }
            
            redis_client.setex(cache_key, 10, json.dumps(analytics_data, default=str))
        
        return AnalyticsData(
            short_code=short_code,
            total_clicks=analytics_data['total_clicks'],
            click_history=analytics_data['click_history']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analytics failed for {short_code}: {e}")
        raise HTTPException(status_code=500, detail="Analytics service unavailable")

@app.get("/api/qr/{short_code}")
async def get_qr_code_for_url(short_code: str, db = Depends(get_database_session)):
    """Get QR code for a short URL"""
    try:
        url_record = db.query(URL).filter(URL.short_code == short_code, URL.is_active == True).first()
        if not url_record:
            raise HTTPException(status_code=404, detail="URL not found")
        
        return {
            "short_code": short_code,
            "qr_code": url_record.qr_code,
            "short_url": f"http://localhost:8080/{short_code}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"QR code request failed for {short_code}: {e}")
        raise HTTPException(status_code=500, detail="QR code service unavailable")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
