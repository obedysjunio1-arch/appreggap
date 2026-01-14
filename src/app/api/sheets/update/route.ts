import { NextRequest, NextResponse } from 'next/server'
import { updateInSheets } from '@/lib/google-sheets-server'

export async function POST(request: NextRequest) {
  try {
    const ocorrencia = await request.json()
    await updateInSheets(ocorrencia)
    return NextResponse.json({ success: true, message: 'Ocorrência atualizada no Google Sheets' })
  } catch (error: any) {
    console.error('Erro ao atualizar no Google Sheets:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar no Google Sheets' },
      { status: 500 }
    )
  }
}
