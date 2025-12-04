# Setup Guide

This guide will help you set up the Payroll Management System on your local machine.

## Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- npm or yarn
- Git

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PAY_ROLL_MANAGEMENT
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
# Copy the .env.example content and create .env
# Update the SECRET_KEY with a random string

# Initialize database
# The database will be created automatically on first run

# Seed demo data
python scripts/seed_data.py

# Start the backend server
uvicorn app.main:app --reload
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
# Copy .env.example and create .env.local
# Set VITE_API_URL=http://localhost:8000

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000` (or the port shown in terminal)

### 4. Access the Application

1. Open your browser and navigate to `http://localhost:3000`
2. Use the demo accounts to login:
   - **Admin:** admin@anshumat.org / Admin@2025!
   - **Employee:** hire-me@anshumat.org / HireMe@2025!

## Troubleshooting

### Backend Issues

- **Port 8000 already in use:** Change the port in `uvicorn app.main:app --reload --port 8001`
- **Database errors:** Delete `payroll.db` and run `python scripts/seed_data.py` again
- **Import errors:** Make sure you're in the virtual environment and all dependencies are installed

### Frontend Issues

- **Port 3000 already in use:** Vite will automatically use the next available port
- **API connection errors:** Check that the backend is running and `VITE_API_URL` is correct
- **Build errors:** Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Common Issues

1. **CORS errors:** Make sure the backend CORS_ORIGINS includes your frontend URL
2. **Authentication errors:** Clear browser localStorage and login again
3. **File upload errors:** Ensure the `uploads` directory exists in the backend folder

## Docker Setup (Alternative)

If you prefer using Docker:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Next Steps

- Explore the admin dashboard
- Test expense submission as an employee
- Generate salary slips
- Review the API documentation at `http://localhost:8000/docs`

## Support

If you encounter any issues, please check:
1. All prerequisites are installed
2. Environment variables are set correctly
3. Both backend and frontend servers are running
4. Browser console for any errors

