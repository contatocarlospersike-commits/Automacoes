// Resend API client — graceful fallback when RESEND_API_KEY is not set

const RESEND_API_URL = 'https://api.resend.com'

interface SendEmailParams {
  from: string       // "BREKVA <noreply@yourdomain.com>"
  to: string[]
  subject: string
  html: string
  reply_to?: string
  tags?: Array<{ name: string; value: string }>
}

interface SendEmailResult {
  id?: string
  error?: string
  simulated?: boolean
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    // Simulate success so the app works before Resend is configured
    console.warn('[Resend] RESEND_API_KEY not set — simulating send to:', params.to)
    return { id: `sim_${Date.now()}`, simulated: true }
  }

  try {
    const res = await fetch(`${RESEND_API_URL}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const data = await res.json()

    if (!res.ok) {
      return { error: data.message ?? `Resend error ${res.status}` }
    }

    return { id: data.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

// Interpolate {{variable}} placeholders in HTML
export function interpolateTemplate(html: string, variables: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
}

// Extract variable names from template HTML
export function extractVariables(html: string): string[] {
  const matches = html.matchAll(/\{\{(\w+)\}\}/g)
  return [...new Set([...matches].map((m) => m[1]))]
}
