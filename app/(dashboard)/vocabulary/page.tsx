import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VocabularyList from '@/components/vocabulary/VocabularyList'

export default async function VocabularyPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // 単語帳データを取得
  const { data: vocabulary, error } = await supabase
    .from('vocabulary')
    .select(`
      *,
      reading_sessions (
        genre,
        type,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching vocabulary:', error)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">単語帳</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">保存した単語</h2>
              <p className="text-gray-600 mt-1">
                {vocabulary?.length || 0}個の単語が保存されています
              </p>
            </div>
          </div>
        </div>
        
        <VocabularyList vocabulary={vocabulary || []} />
      </div>
    </div>
  )
}
