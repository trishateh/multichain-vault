'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string | number
  label: string
}

interface CustomSelectProps {
  value: string | number
  options: Option[]
  onChange: (value: string | number) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function CustomSelect({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select...',
  className = ''
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen && isMounted) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      // Prevent body scroll when dropdown is open on mobile
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isOpen, isMounted])

  const selectedOption = options.find(option => option.value === value)

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      triggerRef.current?.focus()
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle()
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      }
    }
  }

  if (!isMounted) {
    // Return a placeholder during SSR
    return (
      <div className={`w-full rounded-xl bg-white/5 border border-white/10 text-white py-3 px-4 pr-8 text-base md:text-sm min-h-[48px] md:min-h-[40px] ${className}`}>
        {placeholder}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full rounded-xl bg-white/5 border border-white/10 text-white focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)] focus:ring-1 focus:outline-none transition-colors py-3 px-4 pr-10 text-base md:text-sm min-h-[48px] md:min-h-[40px] flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'
        } ${className}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="select-label"
      >
        <span className="block truncate text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Mobile overlay */}
          <div className="fixed inset-0 bg-black/20 z-40 md:hidden" />
          
          {/* Dropdown menu */}
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-xl shadow-lg max-h-60 overflow-auto">
            <div
              role="listbox"
              aria-labelledby="select-label"
              className="py-1"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-3 text-base md:text-sm transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none ${
                    option.value === value
                      ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                      : 'text-white'
                  }`}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
