# Restore Guide: Temporarily Hidden Mobile Phone Login (Preserved)

This document provides a complete record of the changes made to temporarily hide the **Mobile Number + SMS OTP** login system from the public storefront of Manoj Mobiles, along with exact instructions and code to restore it at any time.

---

## 1. Summary of Changes

| Feature | Status | Location / Preservation |
| :--- | :--- | :--- |
| **Legacy Mobile Phone + SMS OTP Login** | Temporarily Hidden | Fully preserved in [`components/auth/legacy-mobile-auth.tsx`](file:///components/auth/legacy-mobile-auth.tsx) |
| **New Email + Password Authentication UI** | Active | Implemented in [`app/auth/page.tsx`](file:///app/auth/page.tsx) with service in [`lib/emailAuthService.ts`](file:///lib/emailAuthService.ts) |
| **Backend API Endpoints (Live apiClient)** | Intact & Untouched | `apiClient.sendOtp`, `apiClient.loginWithOtp`, and `apiClient.customerRegister` remain intact in `lib/apiClient.ts` |

---

## 2. Inventory of Affected Files

### A. New & Preserved Files:
1. `components/auth/legacy-mobile-auth.tsx`
   - Contains the 100% complete, original mobile login component with live phone number validation, OTP inputs, countdown timer, and customer registration step.
2. `lib/emailAuthService.ts`
   - Clean, modular service layer providing mock flows and clear `TODO: Connect to backend API endpoint` comments for backend engineers.
3. `app/auth/page.tsx`
   - Active customer authentication page featuring Email + Password UI for both Login and Signup, plus 6-digit OTP verification.

---

## 3. How to Restore the Legacy Mobile + OTP System

If you ever wish to switch back to the Mobile Number + OTP login system, simply choose **Option A (Quick Switch)** or **Option B (Full Replace)**:

### Option A: Quick 2-Line Switch in `app/auth/page.tsx`

Open `app/auth/page.tsx` and replace the default export with `LegacyMobileAuth`:

```tsx
import LegacyMobileAuth from '@/components/auth/legacy-mobile-auth'

export default function AuthPage() {
  return <LegacyMobileAuth />
}
```

### Option B: Restore Original `app/auth/page.tsx` Code

The original code of `app/auth/page.tsx` is stored verbatim inside `components/auth/legacy-mobile-auth.tsx`. You can copy its contents back to `app/auth/page.tsx` whenever desired.

---

## 4. Guide for Backend Developers: Connecting Real Email APIs

The new Email + Password system currently operates with realistic mock delays and demo OTP (`123456`) in frontend-only mode.

To connect real backend APIs, update the methods inside [`lib/emailAuthService.ts`](file:///lib/emailAuthService.ts):

### 1) Login OTP Request
```ts
// In lib/emailAuthService.ts -> requestLoginOtp:
const res = await axiosInstance.post('/api/auth/email/login-otp', {
  email: req.email,
  password: req.password
})
return res.data
```

### 2) Signup OTP Request
```ts
// In lib/emailAuthService.ts -> requestSignupOtp:
const res = await axiosInstance.post('/api/auth/email/signup-otp', {
  name: req.name,
  email: req.email,
  password: req.password
})
return res.data
```

### 3) 6-Digit OTP Verification
```ts
// In lib/emailAuthService.ts -> verifyEmailOtp:
const res = await axiosInstance.post('/api/auth/email/verify-otp', {
  email: req.email,
  otp: req.otp,
  type: req.type, // 'login' | 'signup'
  name: req.name
})
return res.data
```

### 4) Resend OTP
```ts
// In lib/emailAuthService.ts -> resendOtp:
const res = await axiosInstance.post('/api/auth/email/resend-otp', {
  email: req.email,
  type: req.type
})
return res.data
```
