import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const { genre, type, level, wordCount } = await request.json()

    const prompt = `Generate an English ${type} text about ${genre} for ${level} level learners. 
    The text should be approximately ${wordCount} words long. 
    Make it engaging and educational.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert English teacher creating reading materials for language learners."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: wordCount * 2,
    })

    return NextResponse.json({ 
      content: completion.choices[0].message.content 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 }
    )
  }
}
