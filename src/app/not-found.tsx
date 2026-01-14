'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Login from '@/components/Login'

export default function NotFound() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirecionar para home se não encontrado
    router.push('/')
  }, [router])

  return <Login />
}
