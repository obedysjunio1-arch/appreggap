'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Eye, EyeOff, Lock } from 'lucide-react'
import Image from 'next/image'

export default function Login() {
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    setTimeout(() => {
      if (login(password)) {
        toast({
          title: 'Login realizado com sucesso!',
          description: 'Bem-vindo ao REGGAP',
        })
        router.push('/dashboard')
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao fazer login',
          description: 'Senha incorreta. Tente novamente.',
        })
      }
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/background.png"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-[#073e29]/90" />
      </div>

      {/* Login Card */}
      <Card className="relative z-10 w-full max-w-md shadow-2xl border-2 border-[#073e29]/30 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-3 text-center pb-4">
          <div className="flex justify-center mb-2">
            <Image
              src="/logo.png"
              alt="REGGAP Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-3xl font-bold text-[#073e29]">
            REGGAP
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Registro de GAP - Ocorrências, Falhas e Problemas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha de Acesso
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 h-11 text-base border-[#073e29]/20 focus:border-[#073e29] focus:ring-[#073e29]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#073e29]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-[#073e29] hover:bg-[#073e29]/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Sistema de Gestão de Ocorrências</p>
            <p className="mt-1">Grupo DoceMel • Áreas: Logística • Comercial</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
