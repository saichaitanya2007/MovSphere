# 🚀 Quick Reference Card - ShipEx Signup Fix

> **Print this or bookmark it!** Quick lookup for common tasks.

---

## ⚡ Start Services (Copy & Paste)

### Terminal 1 - MySQL
```bash
mysql -u root -p
# Enter password: root
# Then in MySQL:
USE movsphere;
SELECT * FROM users;
```

### Terminal 2 - Backend
```bash
cd backend
mvn spring-boot:run
# Wait for: "Started MovSphereApplication in X seconds"
```

### Terminal 3 - Frontend
```bash
cd shipex
npm install  # if needed
npm run dev
# Visit: http://localhost:5173
```

---

## 🧪 Test Signup

1. **Open** http://localhost:5173
2. **Click** Signup as Shipper
3. **Fill form:**
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `Password123!`
   - Company: `Test Co`
4. **Click** Sign Up
5. **Check database:** `SELECT * FROM users;`

---

## 🔍 Verify in Database

```sql
-- View all users
SELECT * FROM users;

-- View specific user
SELECT * FROM users WHERE email = 'test@example.com';

-- Count users
SELECT COUNT(*) as user_count FROM users;

-- View structure
DESCRIBE users;
```

---

## 🐛 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| **"Network error"** | Ensure backend running on :8080 |
| **No users in DB** | Check backend logs for errors |
| **"Email already registered"** | Use different email address |
| **Frontend won't load** | Run `npm install` in shipex/ |
| **Port 5173 in use** | Kill process: `npx kill-port 5173` |
| **MySQL connection failed** | Ensure MySQL running: `mysql -u root -p` |
| **JWT token missing** | Check localStorage in browser DevTools |

---

## 🔐 Check JWT Token

1. **Open DevTools** → F12 or Ctrl+Shift+I
2. **Go to** Application tab
3. **Find** localStorage
4. **Look for** `auth_token`
5. **Copy value** and decode at jwt.io

Should contain:
```json
{
  "email": "user@example.com",
  "role": "SHIPPER",
  "iat": 1234567890,
  "exp": 1234654290
}
```

---

## 🔌 Test API with cURL

### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+91-1234567890",
    "password": "Password123!",
    "role": "SHIPPER"
  }'
```

### Expected Response
```json
{
  "token": "eyJhbGci...",
  "id": 1,
  "name": "Test User",
  "email": "test@example.com",
  "role": "SHIPPER"
}
```

---

## 📋 What Was Changed

### File 1: `shipex/src/config.js`
**Added:**
```javascript
export const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
export const API_ENDPOINTS = {
  REGISTER: `${BACKEND_API_URL}/api/auth/register`,
  LOGIN: `${BACKEND_API_URL}/api/auth/login`,
  PROFILE: `${BACKEND_API_URL}/api/auth/profile`,
}
```

### File 2: `shipex/src/App.jsx`
**Changed:** `handleSignup` function from sync to async with fetch call

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [QUICK_TEST.md](QUICK_TEST.md) | 5-minute quick start |
| [SOLUTION_SUMMARY.md](SOLUTION_SUMMARY.md) | High-level overview |
| [SIGNUP_FIX_GUIDE.md](SIGNUP_FIX_GUIDE.md) | Complete technical guide |
| [BEFORE_AFTER.md](BEFORE_AFTER.md) | Code comparison |
| [DIAGRAMS.md](DIAGRAMS.md) | Visual explanations |
| [API_REFERENCE.md](API_REFERENCE.md) | API documentation |
| [INDEX.md](INDEX.md) | Navigation guide |

---

## 🎯 Signup Flow (5 Steps)

```
1. User fills form    → Name, Email, Password
2. Click Sign Up      → handleSignup() called
3. fetch() to backend → POST /api/auth/register
4. Backend processes  → Save to MySQL, generate JWT
5. Frontend stores    → Token in localStorage, show dashboard
```

---

## 🔐 Security Checklist

- [x] Password hashed with bcrypt
- [x] JWT token for auth
- [x] Email uniqueness enforced
- [ ] HTTPS in production (TODO)
- [ ] HttpOnly cookies (TODO)
- [ ] Email verification (TODO)
- [ ] Rate limiting (TODO)
- [ ] CSRF protection (TODO)

See [SIGNUP_FIX_GUIDE.md](SIGNUP_FIX_GUIDE.md#-security-notes) for details.

---

## 📞 Common Questions

**Q: Where is user data stored?**
A: MySQL database (primary), localStorage (secondary for frontend state)

**Q: How is password stored?**
A: Hashed with bcrypt, never in plain text

**Q: What is JWT token?**
A: Authentication token that proves user logged in (24-hour expiration)

**Q: Where is JWT stored?**
A: localStorage.auth_token (secure HttpOnly cookie in production)

**Q: Do I need to restart services?**
A: Yes, after code changes. No if just testing.

**Q: Why does signup show message but no error?**
A: Before fix - data wasn't reaching backend. After fix - reaches MySQL.

---

## 🚀 Next Steps After Fixing Signup

1. **Login** - Integrate login with backend
2. **Profile** - User profile management
3. **2FA** - Two-factor authentication
4. **Email Verification** - Verify email before activation
5. **Password Reset** - Forgot password flow
6. **RBAC** - Role-based access control

See [SIGNUP_FIX_GUIDE.md](SIGNUP_FIX_GUIDE.md#-next-steps) for full roadmap.

---

## 💾 Important Paths

```
Database:    localhost:3306 (user: root, pass: root)
Backend:     http://localhost:8080
Frontend:    http://localhost:5173
API:         POST http://localhost:8080/api/auth/register
MySQL DB:    movsphere
MySQL Table: users
```

---

## ✅ Success Indicators

- [ ] Backend running (shows "Started MovSphereApplication")
- [ ] Frontend running (accessible at localhost:5173)
- [ ] Form submits without error
- [ ] JWT token in localStorage
- [ ] User appears in MySQL
- [ ] Can see user with `SELECT * FROM users;`

All checked? ✅ **Signup fix is working!**

---

## 🔧 Development Mode

```bash
# Watch for file changes
npm run dev      # Frontend auto-reloads
mvn spring-boot:run  # Backend auto-reloads

# Check for errors
# Frontend: Browser console (F12)
# Backend: Terminal output
# Database: Check with MySQL client
```

---

## 🐳 Docker (Optional)

```bash
# If using Docker for MySQL:
docker run --name movsphere-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=movsphere \
  -p 3306:3306 \
  mysql:8.0

# Then use same credentials in application.yml
```

---

## 📌 PIN TO YOUR DESK / BOOKMARK

**Save this file!** Reference it while developing:
- 3-4 commands to start services
- Quick API test
- Common troubleshooting
- File locations

---

## 🎓 Learning Resources

| Topic | Resource |
|-------|----------|
| JWT | https://jwt.io |
| Spring Boot | https://spring.io/projects/spring-boot |
| React | https://react.dev |
| MySQL | https://dev.mysql.com/doc |
| bcrypt | https://github.com/dcodeIO/bcrypt.js |

---

## ⏱️ Timing

| Task | Time |
|------|------|
| Start services | 2 min |
| Test signup | 2 min |
| Check database | 1 min |
| Total | 5 min ⚡ |

---

**Last Updated:** 2026-08-13  
**Status:** ✅ READY TO USE  

---

**👉 Next:** Follow [QUICK_TEST.md](QUICK_TEST.md) to verify the fix!
