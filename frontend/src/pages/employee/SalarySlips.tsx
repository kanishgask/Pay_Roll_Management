import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Download } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface SalarySlip {
  id: number
  month: number
  year: number
  basic_salary: number
  allowances: number
  deductions: number
  tax: number
  net_salary: number
  status: string
  payment_date?: string
}

export default function EmployeeSalarySlips() {
  const { data: salarySlips = [], isLoading } = useQuery<SalarySlip[]>({
    queryKey: ['employee-salary-slips'],
    queryFn: async () => {
      const response = await api.get('/employee/salary-slips')
      return response.data
    },
  })

  const downloadPDF = async (slipId: number) => {
    try {
      const response = await api.get(`/employee/salary-slips/${slipId}/pdf`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `salary_slip_${slipId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('PDF downloaded successfully')
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
      <div>
        <h1 className="text-3xl font-bold">My Salary Slips</h1>
        <p className="text-muted-foreground">View and download your salary slips</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : salarySlips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No salary slips found
            </div>
          ) : (
            <div className="space-y-4">
              {salarySlips.map((slip) => (
                <div
                  key={slip.id}
                  className="flex items-center justify-between p-6 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Period</p>
                        <p className="text-2xl font-bold">
                          {slip.month.toString().padStart(2, '0')}/{slip.year}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Net Salary</p>
                        <p className="text-2xl font-bold text-primary">
                          ${slip.net_salary.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Basic Salary</p>
                        <p className="font-medium">${slip.basic_salary.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Allowances</p>
                        <p className="font-medium text-green-600">
                          +${slip.allowances.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Deductions</p>
                        <p className="font-medium text-red-600">
                          -${(slip.deductions + slip.tax).toLocaleString()}
                        </p>
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
                      onClick={() => downloadPDF(slip.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
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

