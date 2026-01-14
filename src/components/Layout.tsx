'use client'

import { ReactNode, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/store/useAuth'
import { useTheme } from '@/store/useTheme'
import { Button } from '@/components/ui/button'
import { LogOut, Home, ClipboardList, FileText, Settings, Moon, Sun, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const isDarkMode = theme === 'dark'

  // Otimizar navegação com useCallback
  const handleNavigation = useCallback((href: string) => {
    if (pathname !== href) {
      router.push(href)
    }
    setIsMobileMenuOpen(false)
  }, [router, pathname])

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/') {
      router.push('/')
    }
  }, [isAuthenticated, pathname, router])

  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Ocorrências', href: '/ocorrencias', icon: ClipboardList },
    { name: 'Relatórios', href: '/relatorios', icon: FileText },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
  ]

  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className={cn('min-h-screen bg-background', isDarkMode && 'dark')}>
      {/* Sidebar - Desktop */}
      <aside className={cn(
        "hidden md:flex fixed inset-y-0 left-0 z-50 flex-col bg-card border-r border-border transition-all duration-200 ease-in-out",
        isSidebarOpen ? "w-64 lg:w-72" : "w-20"
      )}>
        <div className="flex flex-col items-center justify-center h-24 px-4 lg:px-6 border-b border-border py-3">
          {isSidebarOpen ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <Image
                src="/logo.png"
                alt="REGGAP Logo"
                width={60}
                height={60}
                className="object-contain"
              />
              <h1 className="text-lg font-bold text-[#073e29] dark:text-green-400 text-center">
                REGGAP
              </h1>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <Image
                src="/logo.png"
                alt="REGGAP Logo"
                width={50}
                height={50}
                className="object-contain"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 absolute top-2 right-2"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex-1 px-2 lg:px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Button
                key={item.name}
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full gap-3 transition-colors',
                  isActive ? 'bg-[#073e29] text-white hover:bg-[#073e29]/90 dark:bg-green-600 dark:hover:bg-green-700' : 'hover:bg-accent',
                  !isSidebarOpen && 'justify-center px-2'
                )}
                onClick={() => handleNavigation(item.href)}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="text-sm">{item.name}</span>}
              </Button>
            )
          })}
        </nav>

        <div className="p-2 lg:p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full gap-3 hover:bg-accent",
              !isSidebarOpen && "justify-center px-2"
            )}
            onClick={toggleTheme}
            title={!isSidebarOpen ? (isDarkMode ? 'Modo Claro' : 'Modo Escuro') : undefined}
          >
            {isDarkMode ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
            {isSidebarOpen && <span className="text-sm">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full gap-3 text-destructive hover:text-destructive hover:bg-destructive/10",
              !isSidebarOpen && "justify-center px-2"
            )}
            onClick={handleLogout}
            title={!isSidebarOpen ? 'Sair' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="text-sm">Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md hover:bg-accent text-[#073e29] dark:text-green-400"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="REGGAP Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-bold text-lg text-[#073e29] dark:text-green-400">
              REGGAP
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-[#073e29] dark:text-green-400"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background">
          <div className="flex items-center justify-between h-16 px-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="REGGAP Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="font-bold text-lg text-[#073e29] dark:text-green-400">REGGAP</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-md hover:bg-accent text-[#073e29] dark:text-green-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="p-4 space-y-2 bg-background">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.name}
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive && 'bg-[#073e29] text-white hover:bg-[#073e29]/90 dark:bg-green-600 dark:hover:bg-green-700'
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Button>
              )
            })}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive mt-4"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              Sair
            </Button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        'min-h-screen transition-all duration-200 ease-in-out',
        isSidebarOpen ? 'md:ml-64 lg:ml-72' : 'md:ml-20',
        'pt-16 md:pt-0'
      )}>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
