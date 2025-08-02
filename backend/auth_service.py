import hashlib
from fastapi import HTTPException, Request, Depends
from sqlalchemy.orm import Session
from database import User, get_database_session

def hash_user_password(password: str) -> str:
    """Hash a password - using SHA-256 for simplicity"""
    return hashlib.sha256(password.encode()).hexdigest()

def check_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_user_password(password) == hashed_password

def get_logged_in_user(request: Request, db: Session = Depends(get_database_session)) -> User:
    """Get the current user from session - throws error if not logged in"""
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="You need to login first")
    
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User account not found or inactive")
    
    return user

def create_user_account(name: str, email: str, password: str, db: Session) -> User:
    """Create a new user account"""
    
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered")
    
    password_hash = hash_user_password(password)
    
    new_user = User(
        name=name,
        email=email,
        password_hash=password_hash
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

def authenticate_user_login(email: str, password: str, db: Session) -> User:
    """Authenticate user login - returns user if successful"""
    
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="Account not found. Please check your email or register first.")
    
    if not check_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid password. Please try again.")
    
    return user
