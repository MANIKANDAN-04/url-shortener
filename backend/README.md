# Backend API Service

## Overview

The backend service provides the core functionality for the URL shortening application. Built with FastAPI, it delivers high-performance REST APIs for URL management, user authentication, and analytics tracking.

## Core Features

- **User Management**: Secure user registration, authentication, and account management
- **URL Shortening**: Convert long URLs into compact, shareable short links
- **Redirect Service**: Fast URL resolution and redirection with sub-100ms response times
- **Analytics Engine**: Comprehensive click tracking and performance metrics
- **QR Code Generation**: Automatic QR code creation for all shortened URLs

## System Architecture

The backend follows a RESTful API design pattern with the following workflow:

1. **URL Creation**: Users submit long URLs through authenticated endpoints
2. **Code Generation**: System generates unique short codes with optional custom naming
3. **Data Storage**: URLs and metadata are stored in MySQL with Redis caching
4. **Click Processing**: Incoming requests are resolved through optimized lookup algorithms
5. **Analytics Collection**: User interactions are tracked and aggregated for reporting

## Project Structure

### Application Components
```
backend/
├── main.py           # FastAPI application and route definitions
├── database.py       # Database models and connection management
├── auth_service.py   # Authentication and authorization logic
├── url_service.py    # URL processing and QR code generation
├── requirements.txt  # Python dependencies
└── Dockerfile       # Container configuration
```

### Technology Stack
- **FastAPI**: Modern Python web framework for building APIs
- **MySQL**: Relational database for persistent data storage
- **Redis**: In-memory cache for high-performance URL resolution
- **SQLAlchemy**: Object-relational mapping for database operations
- **Pydantic**: Data validation and serialization

## API Endpoints

### Authentication Services

**User Registration**
- Create new user accounts with email verification
- Secure password hashing and storage
- Account activation and profile setup

**User Authentication**
- Session-based login with secure token management
- Password reset and account recovery
- User profile information retrieval

**Session Management**
- Secure logout and session termination
- Multi-session support and management
- Account security monitoring

### URL Management Services

**URL Shortening**
- Convert long URLs to shortened versions
- Custom short code assignment with validation
- Expiration date configuration for temporary links
- Automatic QR code generation and encoding

**URL Operations**
- Retrieve user's URL collection with pagination
- Update URL metadata and settings
- Soft deletion with recovery options
- Bulk operations for multiple URLs

**URL Resolution**
- High-speed URL lookup and redirection
- Click event logging and analytics
- Real-time performance monitoring
- Cache optimization for frequently accessed URLs

### Analytics Services

**Performance Metrics**
- Click count tracking and aggregation
- Geographic and temporal analytics
- Browser and device information collection
- Referrer source analysis

**Data Export**
- Comprehensive analytics reporting
- Data export in multiple formats
- Historical performance analysis
- Custom date range filtering

## Performance Optimization

### Caching Strategy
- **URL Resolution**: Redis-based caching with 1-hour TTL for frequent redirects
- **User Data**: Short-term caching for dashboard queries and user sessions
- **Analytics**: Real-time cache invalidation for accurate click tracking

### Database Optimization
- Indexed columns for fast URL lookups and user queries
- Connection pooling for efficient database resource management
- Optimized query patterns for high-throughput operations

## Security Implementation

### Data Protection
- **Password Security**: SHA-256 hashing with secure salt generation
- **Session Management**: Server-side session storage with secure cookies
- **Input Validation**: Comprehensive data sanitization and validation
- **Access Control**: Role-based permissions and data isolation

### Privacy Compliance
- User data encryption at rest and in transit
- GDPR-compliant data handling and deletion policies
- Anonymous analytics collection without personal identification
- Secure backup and recovery procedures with 48-hour retention

## Development Setup

### Local Environment

```bash
pip install -r requirements.txt

export DATABASE_URL="mysql+pymysql://appuser:apppassword@localhost:3307/urlshortener"
export REDIS_URL="redis://localhost:6380"

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### API Documentation

Interactive API documentation is available at:
- **Through Nginx**: http://localhost:8080/api/docs
- **Direct Backend**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

The documentation provides comprehensive endpoint descriptions, request/response schemas, and interactive testing capabilities.

## Database Architecture

### Data Models
- **Users**: Account information, credentials, and preferences
- **URLs**: Original URLs, short codes, metadata, and configuration
- **Analytics**: Click events, timestamps, and user agent information

### Caching Implementation
- **High-frequency URLs**: 60-minute cache for optimal redirect performance
- **User dashboard data**: 10-second cache for responsive user experience
- **Analytics aggregation**: Real-time updates with smart cache invalidation
