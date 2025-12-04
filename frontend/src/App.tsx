import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import AdminDashboard from './pages/admin/Dashboard'
import EmployeeDashboard from './pages/employee/Dashboard'
import AdminEmployees from './pages/admin/Employees'
import AdminSalarySlips from './pages/admin/SalarySlips'
import AdminExpenses from './pages/admin/Expenses'
import EmployeeSalarySlips from './pages/employee/SalarySlips'
import EmployeeExpenses from './pages/employee/Expenses'
import EmployeeProfile from './pages/employee/Profile'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoadingSpinner from './components/common/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} />} />
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} />} />
      
      <Route element={<Layout />}>
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminEmployees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/salary-slips"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminSalarySlips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/expenses"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminExpenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee"
          element={
            <ProtectedRoute>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/salary-slips"
          element={
            <ProtectedRoute>
              <EmployeeSalarySlips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/expenses"
          element={
            <ProtectedRoute>
              <EmployeeExpenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/profile"
          element={
            <ProtectedRoute>
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/employee') : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App

