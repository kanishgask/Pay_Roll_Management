import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Plus, Search, Download } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface SalarySlip {
  id: number
  employee_id: number
  month: number
  year: number
  basic_salary: number
  allowances: number
  deductions: number
  tax: number
  net_salary: number
  status: string
  payment_date?: string
  employee?: {
    full_name: string
    email: string
  }
}

export default function AdminSalarySlips() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    employee_id: '',
    month: '',
    year: '',
    basic_salary: '',
    allowances: '',
    deductions: '',
    tax: '',
  })
  const queryClient = useQueryClient()

  const { data: salarySlips = [], isLoading } = useQuery<SalarySlip[]>({
    queryKey: ['admin-salary-slips'],
    queryFn: async () => {
      const response = await api.get('/admin/salary-slips')
      return response.data
    },
  })

  const filteredSlips = salarySlips.filter((slip) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      slip.employee?.full_name?.toLowerCase().includes(term) ||
      slip.employee?.email?.toLowerCase().includes(term) ||
      `${slip.month}/${slip.year}`.includes(term) ||
      String(slip.employee_id).includes(term)
    )
  })

  const createSlip = useMutation({
    mutationFn: async () => {
      const payload = {
        employee_id: Number(form.employee_id),
        month: Number(form.month),
        year: Number(form.year),
        basic_salary: Number(form.basic_salary),
        allowances: Number(form.allowances || 0),
        deductions: Number(form.deductions || 0),
        tax: Number(form.tax || 0),
      }
      await api.post('/admin/salary-slip', payload)
    },
    onSuccess: () => {
      toast.success('Salary slip created')
      setShowCreate(false)
      setForm({
        employee_id: '',
        month: '',
        year: '',
        basic_salary: '',
        allowances: '',
        deductions: '',
        tax: '',
      })
      queryClient.invalidateQueries({ queryKey: ['admin-salary-slips'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create salary slip')
    },
  })

  const downloadPDF = async (slipId: number) => {
    try {
      const response = await api.get(`/admin/salary-slips/${slipId}/pdf`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `salary_slip_${slipId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('PDF downloaded')
    } catch (error) {
      toast.error('Failed to download PDF')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Salary Slips</h1>
          <p className="text-muted-foreground">Manage employee salary slips</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Salary Slip
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/30 shadow-lg">
          <CardHeader>
            <CardTitle>Create Salary Slip</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee ID</label>
                <Input
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  placeholder="e.g. 2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Month</label>
                <Input
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  placeholder="1-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Input
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="2025"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Basic Salary</label>
                <Input
                  value={form.basic_salary}
                  onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Allowances</label>
                <Input
                  value={form.allowances}
                  onChange={(e) => setForm({ ...form, allowances: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deductions</label>
                <Input
                  value={form.deductions}
                  onChange={(e) => setForm({ ...form, deductions: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax</label>
                <Input
                  value={form.tax}
                  onChange={(e) => setForm({ ...form, tax: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => createSlip.mutate()}
                disabled={
                  createSlip.isPending ||
                  !form.employee_id ||
                  !form.month ||
                  !form.year ||
                  !form.basic_salary
                }
              >
                {createSlip.isPending ? 'Creating...' : 'Create Slip'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search salary slips..."
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
          ) : filteredSlips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No salary slips found</div>
          ) : (
            <div className="space-y-4">
              {filteredSlips.map((slip) => (
                <div
                  key={slip.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {slip.employee?.full_name || `Employee #${slip.employee_id}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {slip.employee?.email}
                        </p>
                      </div>
                      <div className="ml-8">
                        <p className="text-sm text-muted-foreground">Period</p>
                        <p className="font-medium">
                          {slip.month.toString().padStart(2, '0')}/{slip.year}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Net Salary</p>
                        <p className="font-bold text-lg">${slip.net_salary.toLocaleString()}</p>
                      </div>
                      {slip.payment_date && (
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Date</p>
                          <p className="font-medium">
                            {format(new Date(slip.payment_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(slip.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadPDF(slip.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    {/* Edit functionality could be added here if needed */}
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

