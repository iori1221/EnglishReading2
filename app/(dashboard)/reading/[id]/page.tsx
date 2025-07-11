// app/(dashboard)/reading/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReadingContent from '@/components/reading/ReadingContent'

interface PageProps {
  params: {
    id: string
  }
}

export default async function ReadingSessionPage({ params }: PageProps) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // セッションデータを取得
  const { data: session, error } = await supabase
    .from('reading_sessions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !session) {
    redirect('/reading')
  }

  // 既存の単語帳データを取得
  const { data: vocabulary } = await supabase
    .from('vocabulary')
    .select('word')
    .eq('user_id', user.id)
    .eq('session_id', params.id)

  const savedWords = vocabulary?.map(v => v.word) || []

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <a href="/reading" className="text-blue-600 hover:underline">
          ← 読書選択に戻る
        </a>
      </div>
      
      <ReadingContent 
        session={session} 
        savedWords={savedWords}
      />
    </div>
  )
}
