/**
 * ============================================================================
 * EMAIL + PASSWORD AUTHENTICATION SERVICE (FRONTEND MOCK / BACKEND READY)
 * ============================================================================
 * 
 * This service handles Email + Password login, signup, and 6-digit email OTP
 * verification flows.
 * 
 * NOTE FOR BACKEND DEVELOPERS:
 * All methods below currently run a realistic demo flow (with simulated network latency).
 * To connect to real backend APIs, replace the mock returns with the commented
 * axios/fetch API calls marked with `TODO: Connect to backend API endpoint`.
 * ============================================================================
 */

export interface EmailLoginRequest {
  email: string
  password: string
}

export interface EmailSignupRequest {
  name?: string
  email: string
  password: string
}

export interface VerifyEmailOtpRequest {
  email: string
  otp: string
  type: 'login' | 'signup'
  name?: string
}

export interface ResendEmailOtpRequest {
  email: string
  type: 'login' | 'signup'
}

export interface EmailAuthResult {
  token: string
  refreshToken: string
  userId: string
  name: string
  role: string
  email: string
}

export interface ServiceResponse<T> {
  success: boolean
  message: string
  data?: T
}

// Demo default OTP (can also accept any 6-digit number in mock mode if needed)
export const DEMO_OTP = '123456'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const emailAuthService = {
  /**
   * Request OTP for Email Login
   * Verifies credentials and sends 6-digit OTP to user's registered email
   */
  async requestLoginOtp(req: EmailLoginRequest): Promise<ServiceResponse<{ email: string; demoOtp?: string }>> {
    // Simulated network latency
    await sleep(650)

    // TODO: Connect to backend API endpoint:
    // const res = await axiosInstance.post<ApiResponse<any>>('/api/auth/email/login-otp', req)
    // return res.data

    if (!req.email || !req.password) {
      throw new Error('Please enter both email and password.')
    }

    if (req.password.length < 6) {
      throw new Error('Password must be at least 6 characters.')
    }

    // Mock validation success
    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${req.email}.`,
      data: {
        email: req.email.toLowerCase().trim(),
        demoOtp: DEMO_OTP
      }
    }
  },

  /**
   * Request OTP for Email Signup
   * Validates registration info and sends 6-digit OTP to verify email ownership
   */
  async requestSignupOtp(req: EmailSignupRequest): Promise<ServiceResponse<{ email: string; demoOtp?: string }>> {
    // Simulated network latency
    await sleep(650)

    // TODO: Connect to backend API endpoint:
    // const res = await axiosInstance.post<ApiResponse<any>>('/api/auth/email/signup-otp', req)
    // return res.data

    if (!req.email || !req.password) {
      throw new Error('Please fill in all required fields.')
    }

    if (req.password.length < 6) {
      throw new Error('Password must be at least 6 characters.')
    }

    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${req.email}.`,
      data: {
        email: req.email.toLowerCase().trim(),
        demoOtp: DEMO_OTP
      }
    }
  },

  /**
   * Verify Email OTP (for Login or Signup)
   * Validates 6-digit code and returns authentication tokens and user profile
   */
  async verifyEmailOtp(req: VerifyEmailOtpRequest): Promise<ServiceResponse<EmailAuthResult>> {
    // Simulated network latency
    await sleep(750)

    // TODO: Connect to backend API endpoint:
    // const res = await axiosInstance.post<ApiResponse<AuthResponseDTO>>('/api/auth/email/verify-otp', req)
    // return res.data

    const cleanOtp = req.otp.trim()

    if (cleanOtp.length !== 6) {
      throw new Error('Please enter a valid 6-digit OTP.')
    }

    // In demo mode: accept '123456' or any 6-digit sequence except known failure test
    if (cleanOtp === '000000') {
      throw new Error('Incorrect or expired verification code. Please check your email or resend.')
    }

    // Extract display name from provided name or email username
    const emailName = req.name?.trim() || req.email.split('@')[0].replace(/[._-]/g, ' ')
    const capitalizedName = emailName
      ? emailName.charAt(0).toUpperCase() + emailName.slice(1)
      : 'Customer'

    const mockAuthResult: EmailAuthResult = {
      token: 'mock-jwt-access-token-' + Math.random().toString(36).substring(2, 15),
      refreshToken: 'mock-jwt-refresh-token-' + Math.random().toString(36).substring(2, 15),
      userId: 'usr_' + Math.random().toString(36).substring(2, 10),
      name: capitalizedName,
      role: 'CUSTOMER',
      email: req.email.toLowerCase().trim()
    }

    return {
      success: true,
      message: req.type === 'signup' ? 'Account created successfully!' : 'Login successful!',
      data: mockAuthResult
    }
  },

  /**
   * Resend Email OTP
   */
  async resendOtp(req: ResendEmailOtpRequest): Promise<ServiceResponse<{ email: string; demoOtp?: string }>> {
    await sleep(500)

    // TODO: Connect to backend API endpoint:
    // const res = await axiosInstance.post<ApiResponse<any>>('/api/auth/email/resend-otp', req)
    // return res.data

    return {
      success: true,
      message: `A fresh 6-digit code has been resent to ${req.email}.`,
      data: {
        email: req.email.toLowerCase().trim(),
        demoOtp: DEMO_OTP
      }
    }
  },

  /**
   * Mock Forgot Password request
   */
  async forgotPassword(email: string): Promise<ServiceResponse<void>> {
    await sleep(600)

    // TODO: Connect to backend API endpoint:
    // await axiosInstance.post('/api/auth/email/forgot-password', { email })

    return {
      success: true,
      message: `Password reset instructions have been sent to ${email}.`
    }
  }
}
