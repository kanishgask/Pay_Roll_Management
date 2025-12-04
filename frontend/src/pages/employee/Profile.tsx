import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useAuth } from '../../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  full_name: z.string().min(2),
  department: z.string().optional(),
  position: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function EmployeeProfile() {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['employee-profile'],
    queryFn: async () => {
      const response = await api.get('/employee/profile')
      return response.data
    },
    initialData: user,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      department: profile?.department || '',
      position: profile?.position || '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await api.put('/employee/profile', data)
      return response.data
    },
    onSuccess: (data) => {
      updateUser(data)
      queryClient.invalidateQueries({ queryKey: ['employee-profile'] })
      toast.success('Profile updated successfully')
    },
    onError: () => {
      toast.error('Failed to update profile')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      await api.post('/employee/change-password', data)
    },
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: () => {
      toast.error('Failed to change password')
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    await updateMutation.mutateAsync(data)
  }

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get('current_password') as string
    const newPassword = formData.get('new_password') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    await changePasswordMutation.mutateAsync({ current_password: currentPassword, new_password: newPassword })
    e.currentTarget.reset()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your profile information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  {...register('full_name')}
                  className={errors.full_name ? 'border-destructive' : ''}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={profile?.email || ''} disabled />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input {...register('department')} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Position</label>
                <Input {...register('position')} />
              </div>

              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Password</label>
                <Input type="password" name="current_password" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input type="password" name="new_password" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input type="password" name="confirm_password" required />
              </div>

              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

