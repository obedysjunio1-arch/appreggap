import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onChange, ...props }, ref) => {
    // Tipos que NÃO devem ser convertidos para maiúsculas
    const nonUpperCaseTypes = ['number', 'date', 'email', 'password', 'tel', 'url', 'time', 'datetime-local', 'month', 'week', 'file', 'hidden', 'range', 'color', 'checkbox', 'radio', 'submit', 'reset', 'button', 'image']
    
    const shouldUpperCase = !type || !nonUpperCaseTypes.includes(type)
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (shouldUpperCase && e.target.value) {
        // Converte para maiúsculas mantendo a posição do cursor
        const cursorPosition = e.target.selectionStart
        const upperValue = e.target.value.toUpperCase()
        e.target.value = upperValue
        // Restaura a posição do cursor
        if (cursorPosition !== null) {
          e.target.setSelectionRange(cursorPosition, cursorPosition)
        }
      }
      onChange?.(e)
    }
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
