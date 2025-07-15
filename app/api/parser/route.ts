import { NextRequest, NextResponse } from 'next/server'
import { parseCVText } from '@/lib/utils/parseCVregex'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('Parser API - Request received')

    // Récupérer le fichier depuis FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    console.log('Parser API - File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Valider le type de fichier
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Type de fichier non supporté' },
        { status: 400 }
      )
    }

    // Valider la taille du fichier (10MB max)
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { success: false, error: 'Le fichier ne doit pas dépasser 10MB' },
        { status: 400 }
      )
    }

    // Extraire le contenu textuel du fichier
    let textContent = ''
    
    if (file.type === 'text/plain') {
      textContent = await file.text()
      console.log('Parser API - Text file processed')
    } else if (file.type === 'application/pdf') {
      console.log('Parser API - Processing PDF')
      
      try {
        // Import dynamique de pdf-parse
        const pdfParse = await import('pdf-parse').then(module => module.default || module)
        
        // Convertir le fichier en buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        console.log('Parser API - Buffer created, size:', buffer.length)
        
        // Parser le PDF avec pdf-parse et options pour éviter les erreurs
        const pdfData = await pdfParse(buffer, {
          // Options pour éviter les conflits avec les fichiers de test
          max: 0, // Pas de limite sur les pages
        })
        
        if (!pdfData || !pdfData.text) {
          throw new Error('Aucun texte extrait du PDF')
        }
        
        textContent = pdfData.text
          .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
          .replace(/\n+/g, '\n') // Remplacer les retours à la ligne multiples
          .trim()
        
        console.log('Parser API - PDF parsed successfully, pages:', pdfData.numpages)
        console.log('Parser API - Text extracted, length:', textContent.length)
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError)
        const errorMessage = pdfError instanceof Error ? pdfError.message : String(pdfError)
        
        // Gestion spécifique des erreurs connues
        if (errorMessage.includes('ENOENT') && errorMessage.includes('test/data')) {
          return NextResponse.json(
            { success: false, error: 'Erreur de configuration PDF - contactez le support' },
            { status: 500 }
          )
        }
        
        if (errorMessage.includes('pdf-parse') || errorMessage.includes('Cannot resolve module')) {
          return NextResponse.json(
            { success: false, error: 'Support PDF temporairement indisponible' },
            { status: 501 }
          )
        }
        
        return NextResponse.json(
          { success: false, error: 'Erreur lors de l\'analyse du PDF - vérifiez que le fichier n\'est pas corrompu' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Type de fichier non supporté pour le moment' },
        { status: 501 }
      )
    }

    if (!textContent || textContent.length < 50) {
      return NextResponse.json(
        { success: false, error: 'Le contenu du fichier est vide ou trop court' },
        { status: 400 }
      )
    }

    // Utiliser les regex pour extraire les données structurées
    console.log('Parser API - Parsing with regex')
    const parsedData = parseCVText(textContent)
    
    console.log('Parser API - CV data parsed successfully:', {
      personalInfo: parsedData.personalInfo,
      experiencesCount: parsedData.experiences.length,
      educationCount: parsedData.education.length,
      skillsCount: parsedData.skills.length,
      languagesCount: parsedData.languages?.length || 0,
    })

    // Optionnel : Améliorer avec Gemini si la clé API est disponible
    let improvedData = parsedData
    let source = 'regex-only'
    
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('Parser API - Enhancing with Gemini AI')
        const { GeminiService } = await import('@/lib/gemini/service')
        const geminiService = new GeminiService()
        
        // Améliorer seulement quelques descriptions pour éviter les timeouts
        const maxToImprove = 2
        let improved = 0
        
        for (let i = 0; i < improvedData.experiences.length && improved < maxToImprove; i++) {
          const exp = improvedData.experiences[i]
          if (exp.description && exp.description.length > 10) {
            try {
              const enhanced = await geminiService.improveCVContent(exp.description, 'experience')
              if (enhanced && enhanced.length > exp.description.length * 0.8) {
                improvedData.experiences[i].description = enhanced
                improved++
              }
            } catch (error) {
              console.log('Skipping Gemini enhancement for experience', i, error)
            }
          }
        }
        
        if (improved > 0) {
          source = 'regex+gemini'
          console.log('Parser API - Content enhanced with Gemini')
        }
      } catch (geminiError) {
        console.log('Parser API - Gemini enhancement failed, using regex data:', geminiError)
        // Continue avec les données regex si Gemini échoue
      }
    }

    return NextResponse.json({
      success: true,
      parsedData: improvedData,
      source,
      textLength: textContent.length
    })

  } catch (error) {
    console.error('Parser API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
} 