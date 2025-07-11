// app/(dashboard)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ReadingChart } from '@/components/dashboard/ReadingChart'
import { BookOpen, TrendingUp, Clock, Target } from 'lucide-react'

async function getStats(userId: string) {
  const supabase = createClient()
  
  // 今週の読書データを取得
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  
  const { data: sessions, error } = await supabase
    .from('reading_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', weekAgo.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sessions:', error)
    return {
      totalWords: 0,
      sessionsCount: 0,
      averageWords: 0,
      weeklyData: []
    }
  }

  const totalWords = sessions?.reduce((sum, session) => sum + session.word_count, 0) || 0
  const sessionsCount = sessions?.length || 0
  const averageWords = sessionsCount > 0 ? Math.round(totalWords / sessionsCount) : 0

  // 週間データの集計
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayWords = sessions?.filter(session => 
      session.created_at.startsWith(dateStr)
    ).reduce((sum, session) => sum + session.word_count, 0) || 0

    return {
      date: dateStr,
      words: dayWords
    }
  }).reverse()

  return {
    totalWords,
    sessionsCount,
    averageWords,
    weeklyData
  }
}

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const stats = await getStats(user.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
      
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="今週の総単語数"
          value={stats.totalWords.toLocaleString()}
          icon={<BookOpen className="h-6 w-6" />}
          trend="+12%"
          trendUp={true}
        />
        <StatsCard
          title="学習セッション"
          value={stats.sessionsCount.toString()}
          icon={<Clock className="h-6 w-6" />}
          trend="+5%"
          trendUp={true}
        />
        <StatsCard
          title="平均単語数/セッション"
          value={stats.averageWords.toString()}
          icon={<TrendingUp className="h-6 w-6" />}
          trend="+8%"
          trendUp={true}
        />
        <StatsCard
          title="連続学習日数"
          value="7"
          icon={<Target className="h-6 w-6" />}
          trend="継続中"
          trendUp={true}
        />
      </div>

      {/* グラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">週間読書量</h2>
          <ReadingChart data={stats.weeklyData} />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">最近の学習</h2>
          <div className="space-y-4">
            <p className="text-gray-600">最近の学習セッションが表示されます</p>
            {/* 最近の学習セッションのリスト */}
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="mt-8 flex gap-4">
        <a
          href="/reading"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          新しい読書を始める
        </a>
        <a
          href="/vocabulary"
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
        >
          単語帳を確認
        </a>
      </div>
    </div>
  )
}
