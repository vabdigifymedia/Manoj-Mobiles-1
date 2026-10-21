'use client'

import * as React from 'react'
import { useState } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  placeholder?: string
  icon?: React.ReactNode
  leftIcon?: React.ReactNode
  error?: string
  [key: string]: any
}

const AppInput = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { label, placeholder, icon, leftIcon, error, className = '', style, type = 'text', ...rest } = props
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  return (
    <div className="w-full min-w-[200px] relative">
      {label && (
        <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-[var(--login-color-heading)]">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 text-[var(--login-color-text-secondary)] pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          style={style}
          className={`peer relative z-10 border-2 ${
            error ? 'border-red-500/80 focus:border-red-500' : 'border-[var(--login-color-border)] focus:border-blue-600'
          } h-13 w-full rounded-xl bg-[var(--login-color-surface)] font-medium outline-none drop-shadow-sm transition-all duration-200 ease-in-out focus:bg-[var(--login-color-bg)] placeholder:text-[var(--login-color-text-secondary)] placeholder:font-medium text-[var(--login-color-heading)] text-sm ${
            leftIcon ? 'pl-11' : 'px-4'
          } ${icon ? 'pr-12' : ''} ${className}`}
          {...rest}
        />

        {isHovering && !error && (
          <>
            <div
              className="absolute pointer-events-none top-0 left-0 right-0 h-[2px] z-20 rounded-t-xl overflow-hidden"
              style={{
                background: `radial-gradient(35px circle at ${mousePosition.x}px 0px, var(--login-color-text-primary) 0%, transparent 70%)`,
              }}
            />
            <div
              className="absolute pointer-events-none bottom-0 left-0 right-0 h-[2px] z-20 rounded-b-xl overflow-hidden"
              style={{
                background: `radial-gradient(35px circle at ${mousePosition.x}px 2px, var(--login-color-text-primary) 0%, transparent 70%)`,
              }}
            />
          </>
        )}

        {icon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center text-[var(--login-color-text-secondary)]">
            {icon}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-semibold tracking-wide animate-in fade-in">
          {error}
        </p>
      )}
    </div>
  )
})

AppInput.displayName = 'AppInput'

export { AppInput }
export default AppInput
