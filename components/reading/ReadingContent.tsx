// components/reading/ReadingContent.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { BookOpen, Plus, Check, HelpCircle } from 'lucide-react'

interface ReadingContentProps {
  session: {
    id: string
    user_id: string
    genre: string
    type: string
    level: string
    word_count: number
    content: string
    created_at: string
  }
  savedWords: string[]
}

export default function ReadingContent({ session, savedWords: initialSavedWords }: ReadingContentProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [savedWords, setSavedWords] = useState<string[]>(initialSavedWords)
  const [showDefinition, setShowDefinition] = useState(false)
  const [definition, setDefinition] = useState('')
  const [loadingDefinition, setLoadingDefinition] = useState(false)
  const supabase = createClient()

  // テキストを単語に分割
  const words = session.content.split(/\s+/)

  const handleWordClick = (word: string) => {
    // 句読点を除去
    const cleanWord = word.replace(/[.,!?;:"']/g, '')
    if (cleanWord) {
      setSelectedWord(cleanWord)
      setShowDefinition(false)
    }
  }

  const handleSaveWord = async () => {
    if (!selectedWord) return

    try {
      const { error } = await supabase
        .from('vocabulary')
        .insert({
          user_id: session.user_id,
          word: selectedWord,
          session_id: session.id,
          context: getWordContext(selectedWord)
        })

      if (error) {
        if (error.code === '23505') { // 重複エラー
          toast.error('この単語は既に保存されています')
        } else {
          throw error
        }
      } else {
        setSavedWords([...savedWords, selectedWord])
        toast.success('単語を保存しました')
      }
    } catch (error) {
      console.error('Error saving word:', error)
      toast.error('単語の保存に失敗しました')
    }
  }

  const handleGetDefinition = async () => {
    if (!selectedWord) return

    setLoadingDefinition(true)
    setShowDefinition(true)

    try {
      const response = await fetch('/api/explain-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: selectedWord,
          context: getWordContext(selectedWord)
        }),
      })

      if (!response.ok) throw new Error('Failed to get definition')

      const { explanation } = await response.json()
      setDefinition(explanation)
    } catch (error) {
      console.error('Error getting definition:', error)
      toast.error('定義の取得に失敗しました')
      setDefinition('定義を取得できませんでした')
    } finally {
      setLoadingDefinition(false)
    }
  }

  const getWordContext = (word: string) => {
    const index = words.findIndex(w => w.includes(word))
    if (index === -1) return ''
    
    const start = Math.max(0, index - 5)
    const end = Math.min(words.length, index + 6)
    
    return words.slice(start, end).join(' ')
  }

  const isWordSaved = (word: string) => {
    const cleanWord = word.replace(/[.,!?;:"']/g, '')
    return savedWords.includes(cleanWord)
  }

  return (
    <div>
      {/* ヘッダー情報 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gray-600" />
            <span className="text-gray-600">
              {session.genre} • {session.type} • {session.level}
            </span>
          </div>
          <span className="text-gray-600">{session.word_count}語</span>
        </div>
        
        <div className="text-sm text-gray-500">
          単語をクリックして保存したり、意味を調べることができます
        </div>
      </div>

      {/* 本文 */}
      <div className="bg-white rounded-lg shadow p-8">
        <div className="prose prose-lg max-w-none">
          <p className="leading-relaxed text-lg">
            {words.map((word, index) => (
              <span key={index}>
                <span
                  className={`cursor-pointer hover:bg-blue-100 rounded px-1 ${
                    isWordSaved(word) ? 'bg-green-100' : ''
                  } ${
                    selectedWord === word.replace(/[.,!?;:"']/g, '') ? 'bg-blue-200' : ''
                  }`}
                  onClick={() => handleWordClick(word)}
                >
                  {word}
                </span>
                {' '}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* 選択した単語の操作パネル */}
      {selectedWord && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{selectedWord}</h3>
              <button
                onClick={() => setSelectedWord(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleSaveWord}
                disabled={savedWords.includes(selectedWord)}
                className={`flex items-center gap-2 px-4 py-2 rounded ${
                  savedWords.includes(selectedWord)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {savedWords.includes(selectedWord) ? (
                  <>
                    <Check className="h-4 w-4" />
                    保存済み
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    単語帳に保存
                  </>
                )}
              </button>
              
              <button
                onClick={handleGetDefinition}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                <HelpCircle className="h-4 w-4" />
                意味を調べる
              </button>
            </div>

            {showDefinition && (
              <div className="bg-gray-50 rounded p-4 max-h-48 overflow-y-auto">
                {loadingDefinition ? (
                  <p className="text-gray-600">定義を取得中...</p>
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{definition}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
