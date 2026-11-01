# Quick Start Guide - Testing ShipEx Signup Fix

## ⚡ 3-Step Quick Start

### Step 1: Start MySQL
```bash
# Windows - Open MySQL Command Line Client or use PowerShell
mysql -u root -p
# Enter password: root

# Verify database
    USE movsphere;
    SHOW TABLES;
```

### Step 2: Start Backend (Spring Boot)
```bash
cd backend/
mvn spring-boot:run
```
✅ Backend will start on `http://localhost:8080`

### Step 3: Start Frontend (React)
```bash
cd shipex/
npm install
npm run dev
```
✅ Frontend will start on `http://localhost:5173`

---

## 🧪 Test Signup

1. Open browser: `http://localhost:5173`
2. Click "Sign up"
3. **Select Role:** Shipper
4. **Fill Form:**
   - Full Name: `Alice Shipper`
   - Company: `+91 9876543210`
   - Email: `alice@shipex.com`
   - Password: `test123`
5. Click **"Create account"**

### Expected: ✅ Success!
- Page redirects to dashboard
- No error message appears

### Verify in Database
Open new terminal:
```bash
mysql -u root -p
# Password: root

USE movsphere;
SELECT id, name, email, phone, role, createdAt FROM users;
```

**You should see:**
```
| id | name          | email            | phone          | role    | createdAt           |
|----|---------------|------------------|----------------|---------|---------------------|
| 1  | Alice Shipper | alice@shipex.com | +91 9876543210 | SHIPPER | 2026-08-13 10:30:45 |
```

---

## 🐛 Troubleshooting

### ❌ "Network error. Backend server not running"
**Check:** 
- Is Java running? `netstat -ano | findstr :8080`
- Restart: `mvn spring-boot:run` in `backend/` folder
- Check logs for Spring errors

### ❌ "Email is already registered"
**Solution:** Use a different email address. Your previous test used this email.

### ❌ MySQL connection failed
**Check:**
- MySQL service running: `Services.msc` → search "MySQL"
- Database created: `USE movsphere;` in MySQL CLI
- Check credentials in `backend/src/main/resources/application.yml`:
  - username: `root`
  - password: `root`
  - database: `movsphere`

### ❌ Frontend won't load
**Check:**
- `npm install` ran successfully
- Run `npm run dev` from `shipex/` folder (not `shipex-shipper-dashboard`)
- Port 5173 not in use

---

## 📋 What's Fixed

| Before | After |
|--------|-------|
| ❌ Signup only saved to localStorage | ✅ Signup saves to MySQL database |
| ❌ Users never appeared in `users` table | ✅ Users appear immediately after signup |
| ❌ No backend API calls in signup | ✅ Frontend calls `/api/auth/register` |
| ❌ No JWT tokens generated | ✅ JWT tokens returned and stored |
| ❌ No data persistence across browser restarts | ✅ Data persists in database |

---

## 🔍 How to Verify Data Persists

1. Sign up a shipper: `bob@test.com`
2. **Close browser completely** (kill all Chrome/Firefox processes)
3. Restart browser, go to `http://localhost:5173`
4. You'll see "Sign in" form (not logged in locally)
5. **But data is in MySQL:**
   ```sql
   SELECT * FROM users WHERE email = 'bob@test.com';
   ```
6. ✅ User is still in database! (Frontend localStorage lost but database kept it)

---

## 📊 Database Schema

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

---

## 🎯 Next Test: Try Different Roles

Sign up with different roles to test the backend's role validation:

### Driver Signup
- **Name:** `John Driver`
- **Company:** `+91 9876543211`
- **Email:** `john@shipex.com`
- **Password:** `test123`
- **Role:** Driver

### Admin Signup
- **Name:** `Admin User`
- **Company:** `+91 9876543212`
- **Email:** `admin@shipex.com`
- **Password:** `test123`
- **Role:** Not available in UI (backend supports ADMIN role)

---

## 💾 Keep Logs Running

In separate terminals, run each service and keep logs visible:

**Terminal 1 - MySQL:**
```bash
mysql -u root -p
```

**Terminal 2 - Backend:**
```bash
cd backend/
mvn spring-boot:run
```
Watch for: `Started MovSphereApplication in X seconds`

**Terminal 3 - Frontend:**
```bash
cd shipex/
npm run dev
```
Watch for: `Local: http://localhost:5173`

---

## 🎉 Success Checklist

- [x] MySQL is running
- [x] Backend started successfully on :8080
- [x] Frontend started on :5173
- [x] Signed up as Shipper
- [x] User appears in MySQL `users` table
- [x] Backend returned JWT token (in console if you check)
- [x] No database errors in backend logs

**Congratulations! 🎊 The signup flow is now connected to the database!**

---

**Need Help?** Check the detailed guide: [SIGNUP_FIX_GUIDE.md](SIGNUP_FIX_GUIDE.md)
