# 🔧 Comprehensive Troubleshooting Guide

## Problem-Solution Matrix

### 🔴 Signup Form Issues

#### Problem: "Network error. Backend not running on http://localhost:8080"

**Diagnosis:**
- Frontend successfully submitted form to backend
- Backend is not responding

**Solutions:**

**Step 1: Check if backend is running**
```bash
# Terminal 2 - Check if backend is running
curl http://localhost:8080/actuator/health

# Expected response:
# {"status":"UP"}
```

**Step 2: Start backend if not running**
```bash
cd backend
mvn spring-boot:run
# Wait for: "Started MovSphereApplication in X.XXX seconds"
```

**Step 3: Check backend logs**
```
Look for:
✓ "Started MovSphereApplication"
✗ "ERROR" or "Exception"
```

**Step 4: Verify port 8080 is available**
```powershell
# Windows PowerShell
Get-Process | Where-Object {$_.Port -eq 8080}
# or
netstat -ano | findstr :8080
```

If port is in use:
```bash
# Kill the process
taskkill /PID <PID> /F
# Or use a different port (modify application.yml)
```

**Step 5: Check CORS configuration**
- Backend has CORS enabled for localhost:5173
- If getting CORS error, check `backend/src/main/java/com/movsphere/config/CorsConfig.java`

---

#### Problem: Form submits but nothing happens (no error, no success)

**Diagnosis:**
- Likely JavaScript error in handleSignup function
- Or endpoint not found (404)

**Solutions:**

**Step 1: Check browser console**
```
F12 → Console tab
Look for red error messages
```

**Step 2: Check network tab**
```
F12 → Network tab
1. Fill signup form
2. Click Sign Up
3. Look for POST request to /api/auth/register
4. Click on request
5. Check:
   - Status: Should be 200 (success) or 4xx/5xx (error)
   - Response: Should show error message if failed
   - Request: Check JSON payload is valid
```

**Step 3: Verify API endpoint configuration**
```javascript
// In browser console (F12 → Console)
import { API_ENDPOINTS } from './config.js'
console.log(API_ENDPOINTS.REGISTER)
// Should print: http://localhost:8080/api/auth/register
```

**Step 4: Test API manually with cURL**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "phone": "+91-1234567890",
    "password": "Pass123!",
    "role": "SHIPPER"
  }'

# Check response status (200, 400, 500, etc.)
```

---

#### Problem: "Email already registered"

**This is working correctly!** ✅

The system is preventing duplicate emails, which is good.

**Solution:** Use a different email address

```bash
# Check what emails are registered:
mysql -u root -p movsphere
SELECT email FROM users;
```

---

### 🟡 Database Issues

#### Problem: No users in MySQL after signup

**Diagnosis:**
- Frontend thinks signup succeeded
- But user not in database

**Solutions:**

**Step 1: Verify MySQL is running**
```bash
# Windows - Check MySQL service
Get-Service | Where-Object {$_.Name -like '*MySQL*'}

# Or try connecting
mysql -u root -p
# Password: root
```

**Step 2: Check database and table exist**
```sql
SHOW DATABASES;
-- Look for: movsphere

USE movsphere;
SHOW TABLES;
-- Look for: users

DESCRIBE users;
-- Should show columns: id, name, email, phone, password, role, created_at, updated_at
```

**Step 3: View all users**
```sql
SELECT * FROM users;
-- Should show signup users
```

**Step 4: Check application.yml configuration**
```bash
# File: backend/src/main/resources/application.yml
# Should contain:
# spring.datasource.url=jdbc:mysql://localhost:3306/movsphere
# spring.datasource.username=root
# spring.datasource.password=root
```

**Step 5: Check backend logs for database errors**
```
Spring Boot startup logs should show:
✓ "HHH000412: Hibernate Core..."
✓ "HHH000476: Creating database schema"
✗ "ERROR" or "SQLException"
```

**Step 6: Manual database reset (if needed)**
```sql
-- ⚠️ WARNING: This deletes all users!
DROP TABLE users;

-- Then restart backend to recreate table
-- Spring will auto-create with ddl-auto: update
```

---

#### Problem: MySQL won't start

**Solutions:**

**Windows:**
```powershell
# Check if service exists
Get-Service | Where-Object {$_.Name -like '*MySQL*'}

# Start the service
Start-Service MySQL80  # or your version

# If service doesn't exist, download and install MySQL
# https://dev.mysql.com/downloads/mysql/
```

**Mac:**
```bash
brew services start mysql
```

**Linux:**
```bash
sudo systemctl start mysql
```

---

### 🟢 Storage/Token Issues

#### Problem: JWT token not saving in localStorage

**Diagnosis:**
- User signed up but token not stored
- Likely API response doesn't include token

**Solutions:**

**Step 1: Check API response includes token**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test123@example.com",
    "phone": "+91-1234567890",
    "password": "Pass123!",
    "role": "SHIPPER"
  }' | jq .
  # Look for: "token": "eyJ..."
```

**Step 2: Check localStorage in browser**
```
F12 → Application → localStorage
Look for keys:
- auth_token
- user_email
- shipex-platform-state-v5
```

**Step 3: Check browser localStorage settings**
```javascript
// In browser console (F12 → Console)
console.log(localStorage)
// Should show all stored items
```

**Step 4: Clear and retry**
```javascript
// In browser console (F12 → Console)
localStorage.clear()
// Then signup again
```

---

#### Problem: localStorage full or quota exceeded

**Solutions:**

```javascript
// In browser console (F12 → Console)
// Check storage quota
navigator.storage.estimate().then(estimate => {
  console.log('Used:', estimate.usage)
  console.log('Quota:', estimate.quota)
})

// Clear old data
localStorage.clear()
sessionStorage.clear()
```

---

### 🔵 Frontend Issues

#### Problem: "npm run dev" fails to start

**Diagnosis:**
- Node/npm not installed
- Port 5173 already in use
- Missing dependencies

**Solutions:**

**Step 1: Check Node.js is installed**
```bash
node --version  # Should be v16+
npm --version   # Should be v8+
```

If not installed: https://nodejs.org/

**Step 2: Install dependencies**
```bash
cd shipex
npm install
# Wait for completion (1-2 minutes)
```

**Step 3: Check port 5173 is available**
```powershell
# Windows
netstat -ano | findstr :5173

# Kill if in use
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3000
```

**Step 4: Clear node_modules and reinstall**
```bash
cd shipex
rm -r node_modules
npm install
npm run dev
```

**Step 5: Check for syntax errors**
```
Look in browser console (F12)
Red error messages indicate issues
Check file: shipex/src/config.js and shipex/src/App.jsx
```

---

#### Problem: Form won't submit or button doesn't work

**Solutions:**

**Step 1: Check browser console**
```
F12 → Console
Look for JavaScript errors (red text)
```

**Step 2: Verify form HTML**
```
F12 → Elements tab
Find <form> element
Check all input fields have names
Check button has type="submit"
```

**Step 3: Test with browser DevTools**
```javascript
// In console (F12 → Console)
// Manually call handleSignup
// This requires understanding React state
```

**Step 4: Check React components**
```bash
# Verify files exist and have correct syntax
cat shipex/src/App.jsx | grep -A 20 "const handleSignup"
cat shipex/src/pages/AuthPortal.jsx | grep -A 10 "onSignup"
```

---

### 🟣 Backend/API Issues

#### Problem: POST request returns 400 Bad Request

**Diagnosis:**
- Request JSON is invalid
- Required field missing
- Field type mismatch

**Solutions:**

**Step 1: Check request format**
```bash
# Test with proper JSON format
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+91-1234567890",
    "password": "SecurePass123!",
    "role": "SHIPPER"
  }'
```

**Required fields:**
- `name` (string)
- `email` (string, valid email)
- `phone` (string)
- `password` (string, min 6 chars)
- `role` (string: SHIPPER, DRIVER, ADMIN)

**Step 2: Check email format**
```
Must be valid: test@example.com ✓
Not valid: test@example ✗
Not valid: @example.com ✗
```

**Step 3: View backend validation errors**
```
In backend logs (Terminal 2)
Look for: "Validation failed"
Shows which field is invalid
```

---

#### Problem: POST request returns 409 Conflict

**Diagnosis:**
- Email already exists (conflict with existing user)

**Solution:**
```bash
# Check existing emails
mysql -u root -p movsphere
SELECT email FROM users;

# Use different email for signup
```

---

#### Problem: POST request returns 500 Internal Server Error

**Diagnosis:**
- Backend error (database, password hashing, etc.)

**Solutions:**

**Step 1: Check backend logs**
```
Terminal 2 - Look for ERROR or Exception messages
Example errors:
- SQLException: Connection failed
- NullPointerException: Missing field
- DataIntegrityViolationException: Database constraint
```

**Step 2: Verify database connection**
```bash
# In backend logs, look for:
✓ "HibernateJpaConfiguration"
✓ "Starting server"
✗ "Connection refused"
```

**Step 3: Restart backend**
```bash
# Terminal 2
# Press Ctrl+C to stop
# Then run again
mvn spring-boot:run
```

**Step 4: Check MySQL**
```bash
mysql -u root -p movsphere
SELECT COUNT(*) FROM users;
# Should return a number
```

---

#### Problem: API works with cURL but not from frontend

**Diagnosis:**
- CORS issue (most likely)
- Headers mismatch
- JWT token format

**Solutions:**

**Step 1: Check for CORS error**
```
Browser console (F12)
Look for: "Access to XMLHttpRequest has been blocked by CORS policy"
```

**Step 2: Verify CORS config**
```bash
# File: backend/src/main/java/com/movsphere/config/CorsConfig.java
# Should allow: http://localhost:5173

# If not, update CorsConfig and restart backend
```

**Step 3: Check Content-Type header**
```javascript
// In config.js, should be:
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

---

### 🟠 Full System Restart

If nothing else works, do a full clean restart:

```bash
# 1. Stop everything
# - Close all terminals
# - Close browser tabs with localhost
# - Stop any running services

# 2. Clear caches
rm -rf backend/target                    # Maven cache
rm -rf shipex/node_modules               # npm modules
rm -rf ~/.m2/repository                  # Maven repo (optional)

# 3. Restart fresh
# Terminal 1:
mysql -u root -p
# Password: root
# Then: USE movsphere; SELECT COUNT(*) FROM users;

# Terminal 2:
cd backend
mvn clean install
mvn spring-boot:run

# Terminal 3:
cd shipex
npm install
npm run dev

# 4. Test in browser
# Visit: http://localhost:5173
# Sign up and verify
```

---

## ✅ Verification Checklist

Use this to systematically verify everything is working:

- [ ] **MySQL running**
  ```bash
  mysql -u root -p
  USE movsphere;
  SHOW TABLES;
  ```

- [ ] **Backend running**
  ```bash
  curl http://localhost:8080/actuator/health
  # Should return: {"status":"UP"}
  ```

- [ ] **Frontend running**
  ```
  Visit http://localhost:5173
  Should load without errors
  ```

- [ ] **API endpoint accessible**
  ```bash
  curl -X POST http://localhost:8080/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@test.com","phone":"123","password":"pass","role":"SHIPPER"}'
  # Should return user object with token
  ```

- [ ] **No errors in browser console**
  ```
  F12 → Console → Should be clean (no red errors)
  ```

- [ ] **LocalStorage has auth_token**
  ```
  F12 → Application → localStorage
  Look for: auth_token, user_email
  ```

- [ ] **User in database**
  ```sql
  SELECT * FROM users;
  # Should show signup users
  ```

All checked ✅? **System is working correctly!**

---

## 📞 Still Having Issues?

1. **Check logs first** - Both backend and browser console
2. **Verify each service** - MySQL, backend, frontend
3. **Test API manually** - Use cURL to isolate frontend issues
4. **Check configuration** - application.yml, config.js, CorsConfig.java
5. **Do a full restart** - Clear caches and start fresh
6. **Review documentation** - [SIGNUP_FIX_GUIDE.md](SIGNUP_FIX_GUIDE.md)

---

## 🎓 Common Error Messages and Meanings

| Error | Meaning | Fix |
|-------|---------|-----|
| Network error | Backend unreachable | Start backend on :8080 |
| Email already registered | Duplicate email | Use different email |
| Connection refused | MySQL not running | Start MySQL service |
| CORS policy blocked | Frontend/backend mismatch | Check CorsConfig.java |
| 404 Not Found | Wrong endpoint | Check API path |
| 500 Internal Error | Backend error | Check backend logs |
| Invalid JSON | Bad request format | Check JSON syntax |
| Port already in use | Another app using port | Kill process or use different port |

---

**Last Updated:** 2026-08-13  
**Status:** ✅ COMPLETE  

**Still stuck?** Review [QUICK_TEST.md](QUICK_TEST.md) and [SIGNUP_FIX_GUIDE.md](SIGNUP_FIX_GUIDE.md) for more details.
