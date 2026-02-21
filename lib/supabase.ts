// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Vos informations - NOTEZ LE "p" dans ovpkotqiohxdsjejavms
const SUPABASE_URL = 'https://ovpkotqiohxdsjejavms.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_eKMzEoAIAx4WhiEbN_jZ8Q_Mooxfy9o'

// Vérifier les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY

// Log de débogage
console.log('🔧 Configuration Supabase:')
console.log('URL:', supabaseUrl)
console.log('Clé présente:', !!supabaseAnonKey)
console.log('URL correspond:', supabaseUrl.includes('ovpkotqiohxdsjejavms'))

// Créer le client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Nom de votre bucket
export const STORAGE_BUCKET = 'nrbtalents-uploads'

// Test de connexion
export async function checkSupabaseConnection() {
  try {
    console.log('🧪 Test connexion à:', supabaseUrl)
    
    // Test 1: API health
    const { data: health, error: healthError } = await supabase.from('_health').select('*').limit(1)
    
    // Test 2: Storage
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
    
    if (storageError) {
      console.error('❌ Erreur Storage:', storageError.message)
      return {
        success: false,
        error: storageError,
        message: `Erreur API: ${storageError.message}`
      }
    }
    
    console.log(`✅ Connecté! ${buckets?.length || 0} bucket(s)`)
    
    // Rechercher votre bucket
    const yourBucket = buckets?.find(b => b.name === STORAGE_BUCKET)
    
    if (yourBucket) {
      console.log(`🎯 Bucket "${STORAGE_BUCKET}" trouvé`)
      
      // Tester l'accès au bucket
      const { data: files } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list('', { limit: 1 })
      
      return {
        success: true,
        buckets,
        yourBucket,
        accessible: true,
        message: `Bucket "${STORAGE_BUCKET}" accessible`
      }
    } else {
      console.warn(`⚠️ Bucket "${STORAGE_BUCKET}" non trouvé`)
      
      // Lister les buckets disponibles
      const availableBuckets = buckets?.map(b => b.name) || []
      
      return {
        success: false,
        buckets,
        availableBuckets,
        message: `Bucket "${STORAGE_BUCKET}" non trouvé. Buckets disponibles: ${availableBuckets.join(', ')}`
      }
    }
    
  } catch (error: any) {
    console.error('💥 Erreur fatale:', error)
    return {
      success: false,
      error,
      message: `Erreur: ${error.message || 'Connection failed'}`
    }
  }
}

// Fonctions utilitaires
export async function uploadFileToBucket(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file)
  
  if (error) throw error
  return getPublicUrl(data.path)
}

export function getPublicUrl(path: string) {
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)
  return publicUrl
}