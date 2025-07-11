'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { HelpCircle, Trash2, Calendar, Book } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface VocabularyItem {
  id: string
  word: string
  definition: string | null
  context: string | null
  created_at: string
  reading_sessions: {
    genre: string
    type: string
    created_at: string
  } | null
}

interface VocabularyListProps {
  vocabulary: VocabularyItem[]
}

export default function VocabularyList({ vocabulary: initialVocabulary }: VocabularyListProps) {
  const [vocabulary, setVocabulary] = useState(initialVocabulary)
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null)
  const [definition, setDefinition] = useState('')
  const [loadingDefinition, setLoadingDefinition] = useState(false)
  const supabase = createClient()

  const handleGetDefinition = async (item: VocabularyItem) => {
    setSelectedWord(item)
    setLoadingDefinition(true)

    // 既に定義がある場合はそれを表示
    if (item.definition) {
      setDefinition(item.definition)
      setLoadingDefinition(false)
      return
    }

    try {
      const response = await fetch('/api/explain-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: item.word,
          context: item.context
        }),
      })

      if (!response.ok) throw new Error('Failed to get definition')

      const { explanation } = await response.json()
      setDefinition(explanation)

      // 定義をデータベースに保存
      await supabase
        .from('vocabulary')
        .update({ definition: explanation })
        .eq('id', item.id)

      // ローカルステートを更新
      setVocabulary(prev => prev.map(v => 
        v.id === item.id ? { ...v, definition: explanation } : v
      ))
    } catch (error) {
      console.error('Error getting definition:', error)
      toast.error('定義の取得に失敗しました')
      setDefinition('定義を取得できませんでした')
    } finally {
      setLoadingDefinition(false)
    }
  }

  const handleDeleteWord = async (id: string) => {
    if (!confirm('この単語を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('vocabulary')
        .delete()
        .eq('id', id)

      if (error) throw error

      setVocabulary(prev => prev.filter(v => v.id !== id))
      toast.success('単語を削除しました')
    } catch (error) {
      console.error('Error deleting word:', error)
      toast.error('単語の削除に失敗しました')
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy年M月d日', { locale: ja })
  }

  if (vocabulary.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">まだ単語が保存されていません</p>
        <a href="/reading" className="text-blue-600 hover:underline mt-2 inline-block">
          読書を始める →
        </a>
      </div>
    )
  }

  return (
    <div>
      <div className="divide-y">
        {vocabulary.map((item) => (
          <div key={item.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{item.word}</h3>
                
                {item.context && (
                  <p className="text-gray-600 text-sm mb-2 italic">
                    "{item.context}"
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.created_at)}
                  </span>
                  {item.reading_sessions && (
                    <span className="flex items-center gap-1">
                      <Book className="h-3 w-3" />
                      {item.reading_sessions.genre} • {item.reading_sessions.type}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGetDefinition(item)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="意味を調べる"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteWord(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="削除"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 定義モーダル */}
      {selectedWord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{selectedWord.word}</h2>
                <button
                  onClick={() => setSelectedWord(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingDefinition ? (
                <p className="text-gray-600">定義を取得中...</p>
              ) : (
                <div className="whitespace-pre-wrap">{definition}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
