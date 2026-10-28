import { apiClient } from './apiClient'

/**
 * ============================================================================
 * EMAIL OTP AUTHENTICATION SERVICE (PINE LABS APPROVAL)
 * ============================================================================
 * 
 * Endpoints:
 * 1. POST /api/auth/send-email-otp -> { email }
 * 2. POST /api/auth/login-email-otp -> { email, otp }
 * 3. POST /api/auth/register-email-otp -> { name, email, phone, otp }
 * ============================================================================
 */

export interface EmailAuthResult {
  token: string
  refreshToken: string
  userId?: string
  name: string
  role: string
  email?: string
}

export interface ServiceResponse<T> {
  success: boolean
  message: string
  data?: T
}

export const emailAuthService = {
  /**
   * Check if email is already registered
   * POST /api/auth/check-email
   */
  async checkEmail(email: string): Promise<boolean | null> {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) return false

    try {
      const response = await apiClient.checkEmail(cleanEmail)
      return response.data?.data === true
    } catch {
      // Return null if endpoint is not available so frontend can fallback gracefully
      return null
    }
  },

  /**
   * 1. Send OTP to Email
   * POST /api/auth/send-email-otp
   */
  async sendEmailOtp(email: string): Promise<ServiceResponse<string>> {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      throw new Error('Please enter a valid email address.')
    }

    try {
      const response = await apiClient.sendEmailOtp(cleanEmail)
      const data = response.data
      const receivedOtp = data.data

      // Log OTP to console for dev/testing as requested
      if (receivedOtp) {
        console.log(`[Email OTP] Verification code for ${cleanEmail}: ${receivedOtp}`)
      }

      return {
        success: data.success,
        message: data.message || `OTP sent to ${cleanEmail} successfully`,
        data: receivedOtp
      }
    } catch (err: any) {
      const status = err?.response?.status
      const backendMessage = err?.response?.data?.message
      throw new Error(backendMessage || err?.message || 'Failed to send OTP to email.')
    }
  },

  /**
   * 2. Customer Login with Email OTP
   * POST /api/auth/login-email-otp
   */
  async loginWithEmailOtp(email: string, otp: string): Promise<ServiceResponse<EmailAuthResult>> {
    const cleanEmail = email.trim().toLowerCase()
    const cleanOtp = otp.trim()

    if (!cleanEmail) {
      throw new Error('Please enter your email address.')
    }
    if (!cleanOtp || cleanOtp.length !== 6) {
      throw new Error('Please enter a valid 6-digit OTP.')
    }

    try {
      const response = await apiClient.loginWithEmailOtp(cleanEmail, cleanOtp)
      const resData = response.data

      return {
        success: resData.success,
        message: resData.message || 'Login successful',
        data: {
          token: resData.data.token,
          refreshToken: resData.data.refreshToken,
          userId: resData.data.userId,
          name: resData.data.name,
          role: resData.data.role,
          email: cleanEmail
        }
      }
    } catch (err: any) {
      const status = err?.response?.status
      const backendMessage = err?.response?.data?.message

      if (status === 404) {
        const error = new Error(backendMessage || `No account found with email: ${cleanEmail}. Please sign up first.`)
        ;(error as any).status = 404
        ;(error as any).isNotFound = true
        throw error
      }

      if (status === 400) {
        throw new Error(backendMessage || 'Invalid OTP. Please check and try again.')
      }

      throw new Error(backendMessage || err?.message || 'Login failed. Please try again.')
    }
  },

  /**
   * 3. Customer Sign Up / Register with Email OTP
   * POST /api/auth/register-email-otp
   */
  async registerWithEmailOtp(dto: {
    name: string
    email: string
    phone: string
    otp: string
  }): Promise<ServiceResponse<EmailAuthResult>> {
    const cleanName = dto.name.trim()
    const cleanEmail = dto.email.trim().toLowerCase()
    const cleanPhone = dto.phone.replace(/\D/g, '')
    const cleanOtp = dto.otp.trim()

    if (!cleanName) {
      throw new Error('Please enter your full name.')
    }
    if (!cleanEmail) {
      throw new Error('Please enter a valid email address.')
    }
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number.')
    }
    if (!cleanOtp || cleanOtp.length !== 6) {
      throw new Error('Please enter a valid 6-digit OTP.')
    }

    try {
      const response = await apiClient.registerWithEmailOtp({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        otp: cleanOtp
      })
      const resData = response.data

      return {
        success: resData.success,
        message: resData.message || 'User registered successfully',
        data: {
          token: resData.data.token,
          refreshToken: resData.data.refreshToken,
          userId: resData.data.userId,
          name: resData.data.name,
          role: resData.data.role,
          email: cleanEmail
        }
      }
    } catch (err: any) {
      const status = err?.response?.status
      const backendMessage = err?.response?.data?.message

      if (status === 400) {
        throw new Error(backendMessage || 'Invalid OTP. Please check and try again.')
      }

      throw new Error(backendMessage || err?.message || 'Registration failed. Please try again.')
    }
  }
}
