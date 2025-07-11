'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Book, Newspaper, MessageSquare, FileText, Feather } from 'lucide-react'

const GENRES = [
  { id: 'technology', name: 'テクノロジー', icon: '💻' },
  { id: 'business', name: 'ビジネス', icon: '💼' },
  { id: 'science', name: '科学', icon: '🔬' },
  { id: 'culture', name: '文化', icon: '🎭' },
  { id: 'sports', name: 'スポーツ', icon: '⚽' },
  { id: 'travel', name: '旅行', icon: '✈️' },
  { id: 'food', name: '食べ物', icon: '🍔' },
  { id: 'health', name: '健康', icon: '🏃' },
]

const TYPES = [
  { id: 'magazine', name: '雑誌', icon: <Book className="h-6 w-6" /> },
  { id: 'news', name: 'ニュース', icon: <Newspaper className="h-6 w-6" /> },
  { id: 'sns', name: 'SNS', icon: <MessageSquare className="h-6 w-6" /> },
  { id: 'column', name: 'コラム', icon: <FileText className="h-6 w-6" /> },
  { id: 'novel', name: '小説', icon: <Feather className="h-6 w-6" /> },
]

const LEVELS = [
  { id: 'beginner', name: '初級', description: 'A1-A2' },
  { id: 'intermediate', name: '中級', description: 'B1-B2' },
  { id: 'advanced', name: '上級', description: 'C1-C2' },
]

const WORD_COUNTS = [
  { id: '100', name: '100語', time: '約1分' },
  { id: '300', name: '300語', time: '約3分' },
  { id: '500', name: '500語', time: '約5分' },
  { id: '1000', name: '1000語', time: '約10分' },
]

export default function ReadingPage() {
  const router = useRouter()
  const [genre, setGenre] = useState('')
  const [type, setType] = useState('')
  const [level, setLevel] = useState('')
  const [wordCount, setWordCount] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGenerateText = async () => {
    if (!genre || !type || !level || !wordCount) {
      toast.error('すべての項目を選択してください')
      return
    }

    setLoading(true)
    try {
      // テキスト生成APIを呼び出す
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          genre,
          type,
          level,
          wordCount: parseInt(wordCount),
        }),
      })

      if (!response.ok) throw new Error('Failed to generate text')

      const { content } = await response.json()

      // セッションを保存
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: user.id,
          genre,
          type,
          level,
          word_count: parseInt(wordCount),
          content,
        })
        .select()
        .single()

      if (error) throw error

      // 読書画面に遷移
      router.push(`/reading/${data.id}`)
    } catch (error) {
      console.error('Error:', error)
      toast.error('テキストの生成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">読書を始める</h1>

      {/* ジャンル選択 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">ジャンルを選択</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GENRES.map((g) => (
            <button
              key={g.id}
              onClick={() => setGenre(g.id)}
              className={`p-4 rounded-lg border-2 transition ${
                genre === g.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{g.icon}</div>
              <div className="text-sm font-medium">{g.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* タイプ選択 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">文章タイプを選択</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`p-4 rounded-lg border-2 transition flex flex-col items-center ${
                type === t.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="mb-2">{t.icon}</div>
              <div className="text-sm font-medium">{t.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* レベル選択 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">レベルを選択</h2>
        <div className="grid grid-cols-3 gap-3">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={`p-4 rounded-lg border-2 transition ${
                level === l.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{l.name}</div>
              <div className="text-sm text-gray-600">{l.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 文字数選択 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">文字数を選択</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WORD_COUNTS.map((w) => (
            <button
              key={w.id}
              onClick={() => setWordCount(w.id)}
              className={`p-4 rounded-lg border-2 transition ${
                wordCount === w.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{w.name}</div>
              <div className="text-sm text-gray-600">{w.time}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 生成ボタン */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerateText}
          disabled={loading || !genre || !type || !level || !wordCount}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? '生成中...' : '読書を開始する'}
        </button>
      </div>
    </div>
  )
}
