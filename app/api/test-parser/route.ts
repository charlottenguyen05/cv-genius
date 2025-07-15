import { NextRequest, NextResponse } from 'next/server'
import { parseCVText } from '@/lib/utils/parseCVregex'

export async function POST(request: NextRequest) {
  try {
    console.log('Test Parser API - Request received')

    // Récupérer le fichier depuis FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    console.log('Test Parser API - File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Seulement traiter les fichiers texte pour le test
    if (file.type !== 'text/plain') {
      return NextResponse.json(
        { success: false, error: 'Seuls les fichiers .txt sont supportés pour ce test' },
        { status: 400 }
      )
    }

    // Lire le contenu du fichier
    const textContent = await file.text()
    console.log('Test Parser API - Text content length:', textContent.length)
    console.log('Test Parser API - First 100 chars:', textContent.substring(0, 100))

    if (!textContent || textContent.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Le contenu du fichier est vide ou trop court' },
        { status: 400 }
      )
    }

    // Utiliser les regex pour extraire les données structurées
    console.log('Test Parser API - Parsing with regex')
    const parsedData = parseCVText(textContent)
    
    console.log('Test Parser API - CV data parsed successfully:', {
      personalInfo: parsedData.personalInfo,
      experiencesCount: parsedData.experiences.length,
      educationCount: parsedData.education.length,
      skillsCount: parsedData.skills.length,
      languagesCount: parsedData.languages?.length || 0,
    })

    return NextResponse.json({
      success: true,
      parsedData,
      source: 'regex-only',
      textLength: textContent.length
    })

  } catch (error) {
    console.error('Test Parser API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
} 