import { NextRequest, NextResponse } from 'next/server'
import { CVFormData } from '@/types'
import { geminiService } from '@/lib/gemini/service'
import { cvPDFGenerator } from '@/lib/pdf/generator'

export const runtime = 'nodejs'

/**
 * API principale pour générer un CV amélioré
 * FLOW COMPLET: JSON Form Data → Amélioration Gemini → PDF
 */
export async function POST(request: NextRequest) {
  console.log('🚀 [CV Generator API] Début du flow de génération CV')
  
  try {
    // 1. Récupération des données du formulaire
    const body = await request.json()
    const { cvData }: { cvData: CVFormData } = body
    
    if (!cvData) {
      console.error('❌ Aucune donnée CV fournie')
      return NextResponse.json(
        { success: false, error: 'Données CV requises' },
        { status: 400 }
      )
    }

    // 2. Validation des données essentielles
    if (!cvData.personalInfo?.name || !cvData.personalInfo?.email) {
      console.error('❌ Informations personnelles incomplètes')
      return NextResponse.json(
        { success: false, error: 'Nom et email requis' },
        { status: 400 }
      )
    }

    console.log('📊 Données CV reçues:', {
      personalInfo: Object.keys(cvData.personalInfo).length,
      experiences: cvData.experiences?.length || 0,
      education: cvData.education?.length || 0,
      skills: cvData.skills?.length || 0,
      languages: cvData.languages?.length || 0
    })

    // 3. Amélioration du CV avec Gemini
    console.log('🤖 Amélioration du CV avec Gemini...')
    let improvedCV: CVFormData
    
    try {
      improvedCV = await geminiService.improveCompleteCV(cvData)
      console.log('✅ CV amélioré par Gemini')
    } catch (geminiError) {
      console.error('❌ Erreur Gemini:', geminiError)
      // Fallback: utiliser les données originales si Gemini échoue
      console.log('🔄 Utilisation des données originales en fallback')
      improvedCV = cvData
    }

    // 4. Génération du PDF
    console.log('📄 Génération du PDF...')
    let pdfBuffer: Buffer
    
    try {
      pdfBuffer = await cvPDFGenerator.generatePDF(improvedCV)
      console.log(`✅ PDF généré: ${pdfBuffer.length} bytes`)
    } catch (pdfError) {
      console.error('❌ Erreur génération PDF:', pdfError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la génération du PDF',
          details: pdfError instanceof Error ? pdfError.message : 'Erreur inconnue'
        },
        { status: 500 }
      )
    }

    // 5. Préparation de la réponse avec le PDF
    const fileName = cvPDFGenerator.generateFileName(improvedCV.personalInfo)
    
    console.log('✅ CV généré avec succès!')
    console.log(`📁 Nom du fichier: ${fileName}`)

    // Retourne le PDF en tant que réponse binaire
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'X-CV-Improved': improvedCV !== cvData ? 'true' : 'false',
        'X-Generation-Timestamp': new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Erreur lors de la génération du CV:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne lors de la génération du CV',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

/**
 * Endpoint de test pour vérifier le bon fonctionnement
 */
export async function GET() {
  return NextResponse.json({
    message: 'CV Genius - API de génération CV',
    version: '1.0.0',
    status: 'active',
    flow: [
      '1. Réception des données CV (JSON)',
      '2. Amélioration avec Gemini AI',
      '3. Génération PDF professionnel',
      '4. Téléchargement automatique'
    ],
    requirements: [
      'personalInfo.name (requis)',
      'personalInfo.email (requis)',
      'GEMINI_API_KEY configuré'
    ],
    timestamp: new Date().toISOString()
  })
} 