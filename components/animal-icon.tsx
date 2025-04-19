import type React from "react"
import type { ReactNode } from "react"

interface AnimalIconProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function AnimalIcon({ children, className = "", style = {} }: AnimalIconProps) {
  return (
    <div
      className={`inline-flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 rounded-full w-14 h-14 text-2xl shadow-md ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
