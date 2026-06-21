'use client'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
