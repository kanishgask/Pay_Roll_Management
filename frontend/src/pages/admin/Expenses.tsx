import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Search, Check, X } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Expense {
  id: number
  employee_id: number
  category: string
  amount: number
  description: string
  expense_date: string
  status: 'pending' | 'approved' | 'rejected'
  admin_comment?: string
  employee?: {
    full_name: string
    email: string
  }
}

export default function AdminExpenses() {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['admin-expenses'],
    queryFn: async () => {
      const response = await api.get('/admin/expenses')
      return response.data
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/admin/expenses/${id}/approve`, { comment: 'Approved' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-expenses'] })
      toast.success('Expense approved')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/admin/expenses/${id}/reject`, { comment: 'Rejected' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-expenses'] })
      toast.success('Expense rejected')
    },
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      travel: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      food: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      equipment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      training: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }
    return (
      <Badge className={colors[category.toLowerCase()] || colors.other}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    )
  }

  const pendingExpenses = expenses.filter((e) => e.status === 'pending')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Expense Management</h1>
        <p className="text-muted-foreground">Review and approve employee expenses</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No expenses found</div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {expense.employee?.full_name || `Employee #${expense.employee_id}`}
                        </p>
                        <p className="text-sm text-muted-foreground">{expense.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {getCategoryBadge(expense.category)}
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        {expense.admin_comment && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Comment: {expense.admin_comment}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="font-bold text-lg">${expense.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(expense.status)}
                    {expense.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => approveMutation.mutate(expense.id)}
                          disabled={approveMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => rejectMutation.mutate(expense.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

