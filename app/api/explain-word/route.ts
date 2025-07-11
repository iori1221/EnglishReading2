import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const { word, context } = await request.json()

    const prompt = `Explain the word "${word}" in simple English. 
    ${context ? `Context: "${context}"` : ''}
    Provide:
    1. Definition
    2. Part of speech
    3. Example sentences
    4. Synonyms if applicable`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an English teacher explaining vocabulary to language learners."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    })

    return NextResponse.json({ 
      explanation: completion.choices[0].message.content 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to explain word' },
      { status: 500 }
    )
  }
}
