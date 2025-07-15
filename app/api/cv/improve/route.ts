import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/gemini/service'

export async function POST(request: NextRequest) {
  try {
    // Vérifier que la clé API Gemini est configurée
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Configuration API Gemini manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { content, section } = body

    if (!content || !section) {
      return NextResponse.json(
        { success: false, error: 'Contenu et section requis' },
        { status: 400 }
      )
    }

    // Utiliser le service Gemini pour améliorer le contenu
    const geminiService = new GeminiService()
    const improvedContent = await geminiService.improveCVContent(content, section)

    return NextResponse.json({
      success: true,
      improvedContent
    })

  } catch (error) {
    console.error('Erreur API improve:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
} 