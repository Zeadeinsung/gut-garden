import type { ButtonHTMLAttributes, MouseEvent } from 'react'
import { sfx } from '@/lib/sound'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-garden-mascot text-white hover:bg-[#7A9538]',
  secondary: 'bg-garden-coral text-white hover:bg-[#e07a72]',
  ghost: 'bg-transparent text-garden-forest hover:bg-garden-mascot/10',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-8 py-3.5 text-lg rounded-2xl',
}

export function Button({ variant = 'primary', size = 'md', className = '', onClick, ...props }: ButtonProps) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (!props.disabled) sfx.click()
    onClick?.(e)
  }
  return (
    <button
      className={`font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={handleClick}
      {...props}
    />
  )
}
