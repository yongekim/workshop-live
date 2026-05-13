import OpenAI from "openai"

type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

let cachedClient: OpenAI | null = null

export function getOpenAIClient() {
  if (cachedClient) return cachedClient

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY saknas. Lägg till nyckeln i .env.local och starta om npm run dev."
    )
  }

  cachedClient = new OpenAI({ apiKey })

  return cachedClient
}

export function getAiModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini"
}

export async function createStructuredAiResponse<T>({
  name,
  schema,
  messages,
  temperature = 0.25,
}: {
  name: string
  schema: Record<string, unknown>
  messages: ChatMessage[]
  temperature?: number
}): Promise<T> {
  const openai = getOpenAIClient()

  const completion = await openai.chat.completions.create({
    model: getAiModel(),
    temperature,
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name,
        strict: true,
        schema,
      },
    },
  })

  const content = completion.choices[0]?.message?.content

  if (!content) {
    throw new Error("AI-svaret saknade innehåll.")
  }

  return JSON.parse(content) as T
}