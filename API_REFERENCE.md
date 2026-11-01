# Backend API Reference

## Registration Endpoint

### POST `/api/auth/register`

**Description:** Register a new user (Shipper, Driver, Customer, etc.)

#### Request
```json
{
  "name": "Alice Shipper",
  "email": "alice@shipex.com",
  "phone": "+91 9876543210",
  "password": "test123",
  "role": "SHIPPER"
}
```

**Field Validations:**
- `name`: Max 100 characters, required
- `email`: Valid email format, max 150 characters, must be unique
- `phone`: Max 20 characters, required
- `password`: Max 255 characters, required
- `role`: Must be one of: `SHIPPER`, `DRIVER`, `CUSTOMER`, `SELLER`, `WAREHOUSE_OWNER`, `ADMIN`

#### Success Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": 1,
  "name": "Alice Shipper",
  "email": "alice@shipex.com",
  "role": "SHIPPER"
}
```

#### Error Responses

**409 Conflict - Email Already Exists**
```json
{
  "timestamp": "2026-08-13T10:30:45.123Z",
  "status": 409,
  "error": "Email is already registered.",
  "message": "Email is already registered."
}
```

**400 Bad Request - Invalid Field**
```json
{
  "timestamp": "2026-08-13T10:30:45.123Z",
  "status": 400,
  "error": "Invalid input",
  "message": "Name is required"
}
```

---

## Login Endpoint

### POST `/api/auth/login`

**Description:** Authenticate user and get JWT token

#### Request
```json
{
  "email": "alice@shipex.com",
  "password": "test123"
}
```

#### Success Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": 1,
  "name": "Alice Shipper",
  "email": "alice@shipex.com",
  "role": "SHIPPER"
}
```

#### Error Response - Invalid Credentials
```json
{
  "timestamp": "2026-08-13T10:30:45.123Z",
  "status": 401,
  "error": "Invalid email or password.",
  "message": "Invalid email or password."
}
```

---

## Profile Endpoint

### GET `/api/auth/profile`

**Description:** Get current user profile (requires JWT token)

#### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
```

#### Success Response (200 OK)
```json
{
  "id": 1,
  "name": "Alice Shipper",
  "email": "alice@shipex.com",
  "phone": "+91 9876543210",
  "role": "SHIPPER"
}
```

---

## JWT Token Details

**Token Type:** Bearer token (JWT)

**Token Format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZUBzaGlwZXguY29tIiwicm9sZSI6IlNISVBQRVIiLCJpYXQiOjE2OTMwMDAwMDAsImV4cCI6MTY5MzA4NjQwMH0.signature
```

**Payload Includes:**
- `sub` (subject): User email
- `role`: User role (SHIPPER, DRIVER, etc.)
- `iat` (issued at): Token creation timestamp
- `exp` (expiration): Token expiration timestamp (24 hours default)

**Usage in Frontend:**
```javascript
const token = response.token
localStorage.setItem('auth_token', token)

// Use in subsequent requests
fetch(API_ENDPOINTS.PROFILE, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## Environment Configuration

**File:** `backend/src/main/resources/application.yml`

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/movsphere?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update  # Auto-creates/updates tables
    show-sql: false
    properties:
      hibernate:
        format_sql: true

app:
  jwt:
    secret: ${APP_JWT_SECRET:ZmFrZV9zZWNyZXRfZmFrZV9zZWNyZXRfZmFrZV9zZWNy}
    expiration-ms: ${APP_JWT_EXPIRATION_MS:86400000}  # 24 hours
  cors:
    allowed-origins: ${APP_CORS_ALLOWED_ORIGINS:http://localhost:5173}
```

---

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@shipex.com",
    "phone": "+91 9999999999",
    "password": "test123",
    "role": "SHIPPER"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@shipex.com",
    "password": "test123"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## Testing with Postman

### 1. Create New Request
- Method: `POST`
- URL: `http://localhost:8080/api/auth/register`

### 2. Headers Tab
```
Content-Type: application/json
```

### 3. Body Tab (Raw JSON)
```json
{
  "name": "Alice Shipper",
  "email": "alice@shipex.com",
  "phone": "+91 9876543210",
  "password": "test123",
  "role": "SHIPPER"
}
```

### 4. Send Request
- Should return `200 OK` with JWT token

### 5. Copy Token
- Save the `token` value from response
- Use in Authorization header for protected endpoints

---

## Database Query Reference

After registration, verify in MySQL:

```sql
-- Connect to database
USE movsphere;

-- View all users
SELECT * FROM users;

-- View specific user
SELECT * FROM users WHERE email = 'alice@shipex.com';

-- Check user count by role
SELECT role, COUNT(*) as count FROM users GROUP BY role;

-- View recent registrations
SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5;

-- Update user role (admin only)
UPDATE users SET role = 'ADMIN' WHERE id = 1;

-- Delete user (for testing)
DELETE FROM users WHERE email = 'test@shipex.com';
```

---

## Common API Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Missing required fields | Check all fields: name, email, phone, password, role |
| 409 Conflict | Email already registered | Use unique email address |
| 401 Unauthorized | Invalid credentials | Check email/password spelling |
| 500 Internal Server Error | Database connection failed | Check MySQL is running and credentials in application.yml |
| Connection refused | Backend not running | Start backend: `mvn spring-boot:run` |
| CORS error | Frontend on wrong origin | Check CORS config: `allowed-origins: http://localhost:5173` |

---

## Security Headers

**Recommended for Production:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

---

## Rate Limiting (Future Enhancement)

Consider implementing:
- Max 5 registration attempts per IP per hour
- Max 10 login attempts per email per hour
- Max token refresh: 3 per day per user

---

## API Versioning

For future compatibility, consider:
```
GET /api/v1/auth/profile
POST /api/v1/auth/register
POST /api/v1/auth/login
```

This allows backward compatibility when making breaking changes.

---

**API Status:** ✅ Ready for Integration  
**Last Updated:** 2026-08-13  
**Tested on:** Spring Boot 3.x, Java 17+, MySQL 8.0
