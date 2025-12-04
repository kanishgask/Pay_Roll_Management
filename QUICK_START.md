# 🚀 Quick Start Guide

Follow these steps to run the Payroll Management System on Windows.

## Prerequisites Check

Make sure you have installed:
- ✅ Python 3.11 or higher (`python --version`)
- ✅ Node.js 18 or higher (`node --version`)
- ✅ npm (`npm --version`)

## Option 1: Using Batch Scripts (Easiest)

### Step 1: Start Backend
1. Double-click `run-backend.bat` OR
2. Open terminal in project root and run:
   ```bash
   run-backend.bat
   ```
3. Wait for the server to start (you'll see "Uvicorn running on http://0.0.0.0:8000")
4. Keep this terminal window open

### Step 2: Start Frontend (New Terminal)
1. Open a NEW terminal window
2. Double-click `run-frontend.bat` OR run:
   ```bash
   run-frontend.bat
   ```
3. Wait for Vite to start (usually http://localhost:5173)
4. The browser should open automatically

### Step 3: Login
- **Admin:** admin@anshumat.org / Admin@2025!
- **Employee:** hire-me@anshumat.org / HireMe@2025!

---

## Option 2: Manual Setup

### Backend Setup

```bash
# 1. Navigate to backend folder
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Seed database with demo data
python scripts/seed_data.py

# 6. Start the server
uvicorn app.main:app --reload
```

Backend will run on: **http://localhost:8000**

### Frontend Setup (New Terminal)

```bash
# 1. Navigate to frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Frontend will run on: **http://localhost:5173** (or similar)

---

## ✅ Verification

1. **Backend is running if:**
   - You see "Uvicorn running on..."
   - Visit http://localhost:8000/docs - Swagger UI should load

2. **Frontend is running if:**
   - Browser opens automatically
   - You see the login page
   - No console errors

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError` or import errors
```bash
# Solution: Make sure virtual environment is activated
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

**Problem:** Port 8000 already in use
```bash
# Solution: Use a different port
uvicorn app.main:app --reload --port 8001
# Then update frontend/.env.local: VITE_API_URL=http://localhost:8001
```

**Problem:** Database errors
```bash
# Solution: Delete database and reseed
cd backend
del payroll.db
python scripts/seed_data.py
```

### Frontend Issues

**Problem:** `npm install` fails
```bash
# Solution: Clear cache and retry
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
```

**Problem:** Cannot connect to backend
- Check backend is running
- Check `frontend/.env.local` has correct `VITE_API_URL`
- Check browser console for CORS errors

**Problem:** Port already in use
- Vite will automatically use next available port
- Check terminal for actual port number

---

## 📝 Important Files

- **Backend Config:** `backend/.env`
- **Frontend Config:** `frontend/.env.local`
- **API Docs:** http://localhost:8000/docs (when backend is running)

---

## 🎯 Next Steps

1. Login with admin account
2. Explore the admin dashboard
3. Login with employee account
4. Submit an expense
5. View salary slips

---

## 💡 Tips

- Keep both terminals open while developing
- Backend auto-reloads on code changes
- Frontend hot-reloads automatically
- Check browser console (F12) for frontend errors
- Check backend terminal for API errors

---

Need help? Check the full documentation in `README.md` and `SETUP.md`

