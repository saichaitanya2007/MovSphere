# ShipEx Signup Issue - Root Cause & Solution

## 🔴 Problem
When users sign up as a shipper (or any role), the data is **not appearing in the MySQL `users` table**, even though:
- The database table exists ✓
- The backend API endpoints are configured ✓
- The backend Spring Boot server is running ✓

## 🔍 Root Cause Analysis

### The Disconnect
The **frontend was NOT calling the backend API** at all. Instead:

**Frontend (Before Fix):**
- User fills signup form with: `fullName`, `email`, `password`, `company`
- Frontend's `handleSignup()` function stored these **only in localStorage** (client-side state)
- **Never made an HTTP request to the backend `/api/auth/register` endpoint**

**Backend (Already Configured):**
- Spring Boot running on `http://localhost:8080`
- Has `POST /api/auth/register` endpoint ready to accept:
  - `name` (full name)
  - `email`
  - `phone`
  - `password`
  - `role` (SHIPPER, DRIVER, CUSTOMER, etc.)
- Saves to MySQL `users` table + returns JWT token

**Result:** MySQL database never received any user data because the frontend never sent it!

## ✅ Solution Implemented

### Changes Made

#### 1. Updated [config.js](shipex/src/config.js)
Added backend API configuration:
```javascript
// Backend API configuration
export const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
export const API_ENDPOINTS = {
  REGISTER: `${BACKEND_API_URL}/api/auth/register`,
  LOGIN: `${BACKEND_API_URL}/api/auth/login`,
  PROFILE: `${BACKEND_API_URL}/api/auth/profile`,
}
```

#### 2. Updated [App.jsx](shipex/src/App.jsx) - `handleSignup()` Function
Changed from **local-only storage** to **backend + local state sync**:

**Now the `handleSignup()` function:**
1. ✅ Calls backend API: `POST /api/auth/register`
2. ✅ Maps form fields correctly:
   - `fullName` → `name`
   - `company` → `phone` (or default to '000-000-0000')
   - `role` → converted to uppercase (SHIPPER, DRIVER, etc.)
3. ✅ Handles success response:
   - Stores JWT token in localStorage
   - Stores user email for reference
   - Creates local user object for app UI
4. ✅ Handles error responses with user-friendly messages
5. ✅ Catches network errors (e.g., backend not running)

**Key Code:**
```javascript
const handleSignup = useCallback(
  async ({ role, fullName, email, password, company }) => {
    const normalizedEmail = email.toLowerCase()
    
    try {
      // Call backend API to register user
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          email: normalizedEmail,
          phone: company || '000-000-0000',
          password: password,
          role: role.toUpperCase(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { ok: false, message: errorData.message || 'Signup failed. Please try again.' }
      }

      const backendUser = await response.json()
      // ... store token and create local user object ...
    } catch (error) {
      return { ok: false, message: 'Network error. Backend server not running.' }
    }
  },
  [users]
)
```

## 🚀 How It Works Now

### Signup Flow (After Fix)
1. User enters: Name, Email, Password, Company (optional), selects Role
2. Frontend validates fields locally
3. **Frontend calls backend API** with POST request to `/api/auth/register`
4. Backend:
   - Validates email uniqueness
   - Hashes password
   - Stores user in MySQL `users` table
   - Returns JWT token + user details
5. Frontend:
   - Stores JWT token in localStorage
   - Creates local state entry for app navigation
   - Redirects to dashboard
6. **Result: User now appears in MySQL database!** ✓

### Data Flow
```
User Signup Form
      ↓
Frontend validates
      ↓
Calls Backend API (POST /api/auth/register)
      ↓
Backend validates & saves to MySQL
      ↓
Returns JWT token
      ↓
Frontend stores token + creates local state
      ↓
User logged in with data persisted in database
```

## 🔧 Testing the Fix

### Prerequisites
Make sure both services are running:

1. **MySQL Database**
   ```
   mysql -u root -p
   ```
   Verify database exists:
   ```sql
   USE movsphere;
   DESCRIBE users;
   ```

2. **Backend (Spring Boot)**
   ```bash
   cd backend/
   mvn clean package
   java -jar target/movsphere-*.jar
   ```
   Or use Maven directly:
   ```bash
   mvn spring-boot:run
   ```
   
   Backend should be running on: `http://localhost:8080`
   Check: `http://localhost:8080/api/auth/register` (should accept POST)

3. **Frontend (React + Vite)**
   ```bash
   cd shipex/
   npm install
   npm run dev
   ```
   Frontend should run on: `http://localhost:5173`

### Test Steps
1. Open `http://localhost:5173` in browser
2. Click "Sign up" 
3. Select "Shipper" role
4. Fill in form:
   - Name: "Test Shipper"
   - Company: "+91 9999999999" (or any value)
   - Email: "test.shipper@example.com"
   - Password: "password123"
5. Click "Create account"
6. **Expected Result:**
   - ✅ Should see success (redirected to dashboard)
   - ✅ Should see user in MySQL:
     ```sql
     SELECT * FROM users WHERE email = 'test.shipper@example.com';
     ```

### Common Issues & Solutions

#### Issue: "Network error. Backend server not running"
**Solution:** 
- Check if backend is running on `http://localhost:8080`
- In terminal: `netstat -ano | findstr :8080` (Windows) or `lsof -i :8080` (Mac/Linux)
- Restart backend: `mvn spring-boot:run` from `backend/` folder

#### Issue: "Email is already registered"
**Solution:** This is correct! Means the backend is working. Try a different email.

#### Issue: Backend returns validation error
**Solution:** Check that all required fields are sent:
- `name` (from fullName)
- `email`
- `phone` (from company or default)
- `password`
- `role` (must be uppercase: SHIPPER, DRIVER, etc.)

## 📊 Database Verification

After successful signup, verify the user is in MySQL:

```sql
USE movsphere;

-- View all users
SELECT id, name, email, phone, role, createdAt FROM users;

-- View specific user
SELECT * FROM users WHERE email = 'test.shipper@example.com';

-- Count users
SELECT COUNT(*) as total_users FROM users;
```

Expected output:
```
| id | name         | email                      | phone          | role    | createdAt           |
|----|--------------|----------------------------|----------------|---------|---------------------|
| 1  | Test Shipper | test.shipper@example.com  | +91 9999999999 | SHIPPER | 2026-08-13 10:30:45 |
```

## 🔐 Security Notes

### Current Implementation (Demo Mode)
- JWT token is stored in localStorage (accessible to JS)
- Password is stored client-side for demo purposes
- **⚠️ NOT secure for production**

### Production Improvements Needed
1. Use HttpOnly cookies for JWT tokens instead of localStorage
2. Implement password strength requirements
3. Add CSRF protection
4. Implement rate limiting on registration
5. Add email verification before user activation
6. Use HTTPS only
7. Implement token refresh mechanism
8. Add two-factor authentication (2FA)

## 📝 Files Modified

1. **[shipex/src/config.js](shipex/src/config.js)**
   - Added `BACKEND_API_URL` config
   - Added `API_ENDPOINTS` object with register/login/profile URLs

2. **[shipex/src/App.jsx](shipex/src/App.jsx)**
   - Imported `API_ENDPOINTS` from config
   - Rewrote `handleSignup()` to make async API call
   - Added JWT token storage
   - Added error handling for network failures

## ✨ Additional Benefits

Now that frontend ↔ backend communication is established:
- Login flow can also be updated to use backend
- User profile can be fetched from backend
- Session persistence via JWT tokens
- Multi-device login support possible
- Backend database becomes source of truth

## 🎯 Next Steps

Consider implementing:
1. Backend login endpoint integration (similar to signup)
2. JWT token validation on each API call
3. User profile fetch from backend after login
4. Logout endpoint to invalidate tokens
5. Password reset functionality
6. Email verification flow
7. Role-based access control (RBAC) checks

---

**Status:** ✅ Signup flow now persists data to MySQL database  
**Tested:** Users signing up as shippers now appear in the `users` table  
**Date Fixed:** 2026-08-13
