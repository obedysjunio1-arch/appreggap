import { NextRequest, NextResponse } from 'next/server'
import { deleteFromSheets } from '@/lib/google-sheets-server'

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 })
    }
    await deleteFromSheets(id)
    return NextResponse.json({ success: true, message: 'Ocorrência removida do Google Sheets' })
  } catch (error: any) {
    console.error('Erro ao remover do Google Sheets:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao remover do Google Sheets' },
      { status: 500 }
    )
  }
}
