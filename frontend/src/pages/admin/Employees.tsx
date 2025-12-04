import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Search, Plus } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import toast from 'react-hot-toast'

interface Employee {
  id: number
  email: string
  full_name: string
  department?: string
  position?: string
  avatar_url?: string
  is_active: boolean
  role?: 'admin' | 'employee'
  created_at?: string
}

export default function AdminEmployees() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    department: '',
    position: '',
  })
  const queryClient = useQueryClient()
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['admin-employees', search],
    queryFn: async () => {
      const response = await api.get(`/admin/employees?search=${search}`)
      return response.data
    },
  })

  const createEmployee = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        department: form.department || undefined,
        position: form.position || undefined,
      }
      // Re‑use signup endpoint to create an employee account
      await api.post('/auth/signup', payload)
    },
    onSuccess: () => {
      toast.success('Employee created successfully')
      setShowCreate(false)
      setForm({
        full_name: '',
        email: '',
        password: '',
        department: '',
        position: '',
      })
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create employee')
    },
  })

  const handleViewEmployee = async (employeeId: number) => {
    setDetailsLoading(true)
    try {
      const response = await api.get(`/admin/employees/${employeeId}`)
      setSelectedEmployee(response.data)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load employee')
    } finally {
      setDetailsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage your employees</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/30 shadow-lg">
          <CardHeader>
            <CardTitle>Create Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Employee name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="employee@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Set a temporary password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Position</label>
                <Input
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="e.g. Senior Developer"
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
                onClick={() => createEmployee.mutate()}
                disabled={createEmployee.isPending || !form.full_name || !form.email || !form.password}
              >
                {createEmployee.isPending ? 'Creating...' : 'Create Employee'}
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
                placeholder="Search employees..."
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
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No employees found</div>
          ) : (
            <div className="space-y-4">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {employee.avatar_url ? (
                      <img
                        src={employee.avatar_url}
                        alt={employee.full_name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                        {employee.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{employee.full_name}</p>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {employee.department && (
                          <Badge variant="secondary">{employee.department}</Badge>
                        )}
                        {employee.position && (
                          <Badge variant="outline">{employee.position}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={employee.is_active ? 'success' : 'destructive'}>
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewEmployee(employee.id)}
        >
          View
        </Button>
      {selectedEmployee && (
        <Card className="border-primary/40 shadow-lg animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Employee Details</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Detailed view for {selectedEmployee.full_name}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedEmployee(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {detailsLoading ? (
              <p>Loading details...</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-semibold">{selectedEmployee.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{selectedEmployee.email}</p>
                </div>
                {selectedEmployee.department && (
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-semibold">{selectedEmployee.department}</p>
                  </div>
                )}
                {selectedEmployee.position && (
                  <div>
                    <p className="text-sm text-muted-foreground">Position</p>
                    <p className="font-semibold">{selectedEmployee.position}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedEmployee.is_active ? 'success' : 'destructive'}>
                    {selectedEmployee.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {selectedEmployee.created_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-semibold">
                      {new Date(selectedEmployee.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
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

