import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a Supabase client with ANON key 
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,  // save session to localStorage
    autoRefreshToken: true,  // automatically refreshes expired token
  },
})

// Get user from client's current SESSION (Only works in frontend = client-side)
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Helper pour l'authentification
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// CV/Resume related functions

// Upload PDF to cv-files bucket
export const uploadPdfToStorage = async (filePath: string, file: Buffer) => {
  const { data, error } = await supabase.storage
    .from('cv-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'application/pdf',
    })

  if (error) {
    console.error('Error uploading PDF:', error.message)
    throw new Error(`Upload failed: ${error.message}`)
  }

  return data
}

// Get public URL for a file in cv-files bucket
export const getPdfPublicUrl = (filePath: string) => {
  const { data } = supabase.storage
    .from('cv-files')
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

// Insert resume data into resumes table
export const createResume = async (resumeData: {
  user_id?: string | null,
  title: string,
  generated_content: string
}) => {
  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: resumeData.user_id || null,
      title: resumeData.title,
      generated_content: resumeData.generated_content,
      created_at: new Date().toISOString()
    })
    .select()

  if (error) {
    console.error('Error creating resume:', error.message)
    throw new Error(`Failed to save resume: ${error.message}`)
  }

  return data[0]
}

// Get resume by ID
export const getResumeById = async (id: string) => {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching resume:', error.message)
    throw new Error(`Failed to fetch resume: ${error.message}`)
  }

  return data
}
