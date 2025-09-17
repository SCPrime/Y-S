const completionsUrlFromBase = (baseUrl) => {
  if (!baseUrl) return ''
  const trimmed = baseUrl.replace(/\/+$/, '')
  if (trimmed.endsWith('/chat/completions')) {
    return trimmed
  }
  return `${trimmed}/chat/completions`
}

const ensureAiConfig = (cfg = {}) => {
  const apiKey = cfg.apiKey?.trim()
  const baseUrl = cfg.baseUrl?.trim()
  const model = cfg.model?.trim()

  if (!apiKey) {
    throw new Error('An API key is required for AI extraction.')
  }
  if (!baseUrl) {
    throw new Error('A base URL is required for AI extraction.')
  }
  if (!model) {
    throw new Error('A model name is required for AI extraction.')
  }

  const endpoint = completionsUrlFromBase(baseUrl)
  if (!endpoint) {
    throw new Error('Unable to resolve the chat completions endpoint for the AI provider.')
  }

  return { apiKey, model, endpoint }
}

const parseJsonContent = (choice) => {
  if (!choice) {
    throw new Error('The AI response did not contain any choices.')
  }

  const { parsed, content } = choice
  if (parsed && typeof parsed === 'object') {
    return parsed
  }

  if (typeof content !== 'string') {
    throw new Error('The AI response did not include JSON content.')
  }

  try {
    return JSON.parse(content)
  } catch {
    throw new Error('Failed to parse the AI response as JSON.')
  }
}

const toErrorMessage = async (response) => {
  try {
    const payload = await response.json()
    const message = payload?.error?.message
    if (message) return message
  } catch {
    // Ignore JSON parsing errors and fall back to the status text
  }
  return response.statusText || 'The AI request failed.'
}

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to read the image as a data URL.'))
      }
    }
    reader.onerror = () => {
      reject(new Error('Unable to read the image file for AI vision extraction.'))
    }
    reader.readAsDataURL(file)
  })

const TEXT_EXTRACTION_SYSTEM_PROMPT = [
  'You extract structured metrics from Figment trading dashboard OCR text.',
  'Return JSON with null when a field is missing. Fields: walletSize, realizedPnl, unrealizedPnl, totalTrades, winTrades, lossTrades,',
  'carryPercent, snapshotDate.',
  'Numbers should be plain digits with optional leading minus signs and decimals.',
].join(' ')

const VISION_SYSTEM_PROMPT = [
  'You are a vision assistant that reads Figment trading dashboard screenshots and returns structured metrics.',
  'Return JSON with null for missing fields. Fields: walletSize, realizedPnl, unrealizedPnl, totalTrades, winTrades, lossTrades,',
  'carryPercent, snapshotDate.',
  'Numbers must be plain digits with optional leading minus signs and decimals.',
].join(' ')

export async function llmOcrTextExtract(text, cfg) {
  if (!text?.trim()) {
    throw new Error('No OCR text was provided for AI extraction.')
  }

  const { apiKey, model, endpoint } = ensureAiConfig(cfg)

  const payload = {
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: TEXT_EXTRACTION_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Extract the structured Figment trading metrics from the OCR text:\n\n${text}`,
      },
    ],
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await toErrorMessage(response)
    throw new Error(message)
  }

  const json = await response.json()
  const choice = json?.choices?.[0]?.message
  return parseJsonContent(choice)
}

export async function llmVisionExtractFromImage(file, cfg) {
  if (!file) {
    throw new Error('No image was provided for AI vision extraction.')
  }

  const { apiKey, model, endpoint } = ensureAiConfig(cfg)
  const dataUrl = await readFileAsDataUrl(file)

  const payload = {
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: VISION_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract the Figment trading metrics from this dashboard screenshot. Use null when a field is missing.',
          },
          {
            type: 'image_url',
            image_url: {
              url: dataUrl,
            },
          },
        ],
      },
    ],
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await toErrorMessage(response)
    throw new Error(message)
  }

  const json = await response.json()
  const choice = json?.choices?.[0]?.message
  return parseJsonContent(choice)
}
