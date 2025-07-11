'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface ReadingChartProps {
  data: Array<{
    date: string
    words: number
  }>
}

export function ReadingChart({ data }: ReadingChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    displayDate: format(new Date(item.date), 'M/d', { locale: ja })
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="displayDate" 
          stroke="#6b7280"
        />
        <YAxis 
          stroke="#6b7280"
        />
        <Tooltip 
          formatter={(value: number) => [`${value.toLocaleString()}語`, '単語数']}
          labelFormatter={(label) => `日付: ${label}`}
        />
        <Line 
          type="monotone" 
          dataKey="words" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
