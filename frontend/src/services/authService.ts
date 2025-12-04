import api from './api'

export interface LoginRequest {
  email: string
  password: string
  remember_me?: boolean
}

export interface SignupRequest {
  email: string
  password: string
  full_name: string
  department?: string
  position?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface User {
  id: number
  email: string
  full_name: string
  role: 'admin' | 'employee'
  department?: string
  position?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
}

export const authService = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  signup: async (data: SignupRequest): Promise<TokenResponse> => {
    const response = await api.post('/auth/signup', data)
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email })
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, new_password: newPassword })
  },
}

