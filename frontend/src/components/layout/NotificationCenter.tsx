import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Bell, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  link?: string
}

export default function NotificationCenter({ onClose }: { onClose: () => void }) {
  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/employee/notifications?limit=10')
      return response.data
    },
  })

  const markAsRead = async (id: number) => {
    await api.put(`/employee/notifications/${id}/read`)
    refetch()
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <Card className="absolute right-0 top-12 w-96 max-h-[500px] overflow-y-auto z-50 shadow-lg">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="divide-y">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-muted cursor-pointer transition-colors ${
                !notification.is_read ? 'bg-primary/5' : ''
              }`}
              onClick={() => {
                if (!notification.is_read) {
                  markAsRead(notification.id)
                }
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

