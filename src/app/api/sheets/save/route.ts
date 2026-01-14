import { NextRequest, NextResponse } from 'next/server'
import { saveToSheets } from '@/lib/google-sheets-server'

export async function POST(request: NextRequest) {
  try {
    const ocorrencia = await request.json()
    await saveToSheets(ocorrencia)
    return NextResponse.json({ success: true, message: 'Ocorrência salva no Google Sheets' })
  } catch (error: any) {
    console.error('Erro ao salvar no Google Sheets:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao salvar no Google Sheets' },
      { status: 500 }
    )
  }
}
