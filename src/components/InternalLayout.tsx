'use client'

import { ReactNode } from 'react'
import Layout from '@/components/Layout'

interface InternalLayoutProps {
  children: ReactNode
}

export default function InternalLayout({ children }: InternalLayoutProps) {
  return <Layout>{children}</Layout>
}
