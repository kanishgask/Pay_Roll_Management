import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { API_URL } from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Plus, Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'

const expenseSchema = z.object({
  category: z.enum(['travel', 'food', 'equipment', 'training', 'other']),
  amount: z.number().min(0.01),
  description: z.string().min(5),
  expense_date: z.string(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface Expense {
  id: number
  category: string
  amount: number
  description: string
  expense_date: string
  receipt_url?: string
  status: 'pending' | 'approved' | 'rejected'
  admin_comment?: string
}

export default function EmployeeExpenses() {
  const [showForm, setShowForm] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const queryClient = useQueryClient()

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['employee-expenses'],
    queryFn: async () => {
      const response = await api.get('/employee/expenses')
      return response.data
    },
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setReceiptFile(acceptedFiles[0])
      }
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  })

  const uploadReceipt = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.url
    } catch (error) {
      toast.error('Failed to upload receipt')
      return null
    }
  }

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      let receiptUrl = null
      if (receiptFile) {
        receiptUrl = await uploadReceipt(receiptFile)
      }
      return api.post('/employee/expenses', {
        ...data,
        receipt_url: receiptUrl,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-expenses'] })
      toast.success('Expense submitted successfully')
      reset()
      setReceiptFile(null)
      setShowForm(false)
    },
    onError: () => {
      toast.error('Failed to submit expense')
    },
  })

  const onSubmit = async (data: ExpenseFormData) => {
    await createExpenseMutation.mutateAsync(data)
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Expenses</h1>
          <p className="text-muted-foreground">Submit and track your expenses</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Submit Expense
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Submit New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    {...register('category')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="travel">Travel</option>
                    <option value="food">Food</option>
                    <option value="equipment">Equipment</option>
                    <option value="training">Training</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('amount', { valueAsNumber: true })}
                    className={errors.amount ? 'border-destructive' : ''}
                  />
                  {errors.amount && (
                    <p className="text-sm text-destructive">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Expense description"
                  {...register('description')}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Expense Date</label>
                <Input
                  type="date"
                  {...register('expense_date')}
                  className={errors.expense_date ? 'border-destructive' : ''}
                />
                {errors.expense_date && (
                  <p className="text-sm text-destructive">{errors.expense_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Receipt</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  {receiptFile ? (
                    <p className="text-sm">{receiptFile.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Drag & drop a receipt here, or click to select
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createExpenseMutation.isPending}>
                  {createExpenseMutation.isPending ? 'Submitting...' : 'Submit Expense'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    reset()
                    setReceiptFile(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses found. Submit your first expense!
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-6 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoryBadge(expense.category)}
                          {getStatusBadge(expense.status)}
                        </div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                        </p>
                        {expense.admin_comment && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Comment: {expense.admin_comment}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-2xl font-bold">${expense.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  {expense.receipt_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`${API_URL}${expense.receipt_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Receipt
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

