# 💼 Payroll Management System

A modern, production-ready Payroll Management System built with FastAPI and React. Features beautiful UI/UX, advanced analytics, and comprehensive employee and expense management.

![Payroll Management System](https://img.shields.io/badge/Status-Production%20Ready-success)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)

## ✨ Features

### 🔐 Authentication
- Secure JWT-based authentication
- Role-based access control (Admin & Employee)
- Password strength indicator
- Remember me functionality
- Forgot password flow

### 👨‍💼 Admin Dashboard
- Modern animated statistics cards
- Employee management with advanced filtering
- Salary slip creation and bulk generation
- Expense approval/rejection system
- Advanced data tables with sorting and pagination
- Export reports to PDF and Excel
- Interactive charts and analytics

### 👤 Employee Dashboard
- Personalized welcome interface
- Interactive salary history with charts
- Expense submission with file uploads
- Download salary slips as PDFs
- Notification center
- Profile management

### 🎨 UI/UX Highlights
- Glassmorphism design effects
- Smooth animations and transitions
- Dark mode support
- Fully responsive (mobile, tablet, desktop)
- Skeleton loaders
- Toast notifications
- Interactive data visualizations

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **ReportLab** - PDF generation
- **Python-multipart** - File uploads

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **React Query** - Data fetching
- **Axios** - HTTP client

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd PAY_ROLL_MANAGEMENT

# Start all services
docker-compose up -d

# Backend will be available at http://localhost:8000
# Frontend will be available at http://localhost:3000
```

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Seed demo data
python scripts/seed_data.py

# Start server
uvicorn app.main:app --reload
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

## 🔑 Demo Accounts

### Admin Account
- **Email:** admin@anshumat.org
- **Password:** Admin@2025!

### Employee Account
- **Email:** hire-me@anshumat.org
- **Password:** HireMe@2025!

## 📁 Project Structure

```
payroll-management-system/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── uploads/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── docker-compose.yml
```

## 📡 API Documentation

Once the backend is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🔒 Environment Variables

### Backend (.env)
```env
DATABASE_URL=sqlite:///./payroll.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Backend
The FastAPI application can be deployed to:
- Heroku
- AWS Elastic Beanstalk
- Google Cloud Run
- DigitalOcean App Platform

### Frontend
The React app can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

  
  WATCH HERE:
  https://drive.google.com/file/d/17LZLyGf4gWeqvVL5p9grBKutJjtmbT1V/view?usp=sharing

  
## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ for showcasing modern full-stack development practices.

---

**Note:** This is a production-ready system with comprehensive features. Make sure to change default credentials and secrets before deploying to production.

