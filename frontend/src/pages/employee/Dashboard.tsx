import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { useAuth } from '../../contexts/AuthContext'
import { CreditCard, Receipt, TrendingUp, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'

interface EmployeeStats {
  total_salary_slips: number
  total_expenses: number
  pending_expenses: number
  approved_expenses: number
  total_expense_amount: number
  total_approved_amount: number
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useQuery<EmployeeStats>({
    queryKey: ['employee-dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/employee/dashboard/stats')
      return response.data
    },
  })

  const { data: salarySlips = [] } = useQuery({
    queryKey: ['employee-salary-slips'],
    queryFn: async () => {
      const response = await api.get('/employee/salary-slips?limit=12')
      return response.data
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!stats) return null

  const chartData = salarySlips
    .slice()
    .reverse()
    .map((slip: any) => ({
      month: `${slip.month}/${slip.year}`,
      salary: slip.net_salary,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.full_name}! 👋
        </h1>
        <p className="text-muted-foreground">Here's your payroll overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salary Slips</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_salary_slips}</div>
              <p className="text-xs text-muted-foreground mt-1">Total slips</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_expenses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pending_expenses} pending
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.total_approved_amount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total approved</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.total_expense_amount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All expenses</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Salary History</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="salary"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Net Salary"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No salary data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/employee/expenses">
              <Button className="w-full" variant="outline">
                <Receipt className="mr-2 h-4 w-4" />
                Submit New Expense
              </Button>
            </Link>
            <Link to="/employee/salary-slips">
              <Button className="w-full" variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                View Salary Slips
              </Button>
            </Link>
            <Link to="/employee/profile">
              <Button className="w-full" variant="outline">
                Update Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

