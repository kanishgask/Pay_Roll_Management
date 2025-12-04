import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  User,
  CreditCard,
} from 'lucide-react'
import { cn } from '../../utils/cn'

const adminLinks = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/employees', label: 'Employees', icon: Users },
  { path: '/admin/salary-slips', label: 'Salary Slips', icon: FileText },
  { path: '/admin/expenses', label: 'Expenses', icon: Receipt },
]

const employeeLinks = [
  { path: '/employee', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employee/salary-slips', label: 'Salary Slips', icon: CreditCard },
  { path: '/employee/expenses', label: 'My Expenses', icon: Receipt },
  { path: '/employee/profile', label: 'Profile', icon: User },
]

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const links = user?.role === 'admin' ? adminLinks : employeeLinks

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = location.pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

