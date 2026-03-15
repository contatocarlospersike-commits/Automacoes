// Asaas Payment Gateway API Client
// Docs: https://docs.asaas.com/

// --- Types ---

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
  mobilePhone?: string
}

export interface AsaasCustomerInput {
  name: string
  email: string
  cpfCnpj: string
  mobilePhone?: string
}

export interface AsaasSubscription {
  id: string
  customer: string
  billingType: AsaasBillingType
  value: number
  cycle: string
  nextDueDate: string
  status: string
  description?: string
}

export interface AsaasSubscriptionInput {
  customer: string
  billingType: AsaasBillingType
  value: number
  cycle: 'MONTHLY'
  nextDueDate: string
  description: string
}

export interface AsaasPayment {
  id: string
  customer: string
  billingType: AsaasBillingType
  value: number
  dueDate: string
  description: string
  status: string
  invoiceUrl?: string
  bankSlipUrl?: string
  subscription?: string
}

export interface AsaasPaymentInput {
  customer: string
  billingType: AsaasBillingType
  value: number
  dueDate: string
  description: string
  externalReference?: string
}

export type AsaasBillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD'

interface AsaasErrorResponse {
  errors: Array<{
    code: string
    description: string
  }>
}

// --- Client ---

class AsaasClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, sandbox: boolean) {
    this.apiKey = apiKey
    this.baseUrl = sandbox
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3'
  }

  // --- Customers ---

  async createCustomer(data: AsaasCustomerInput): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('POST', '/customers', data)
  }

  async getCustomer(id: string): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('GET', `/customers/${id}`)
  }

  async findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
    const result = await this.request<{ data: AsaasCustomer[]; totalCount: number }>(
      'GET',
      `/customers?email=${encodeURIComponent(email)}`
    )
    return result.data.length > 0 ? result.data[0] : null
  }

  // --- Subscriptions ---

  async createSubscription(data: AsaasSubscriptionInput): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('POST', '/subscriptions', data)
  }

  async getSubscription(id: string): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('GET', `/subscriptions/${id}`)
  }

  async updateSubscription(
    id: string,
    data: { value?: number; billingType?: AsaasBillingType; updatePendingPayments?: boolean }
  ): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('POST', `/subscriptions/${id}`, data)
  }

  async cancelSubscription(id: string): Promise<void> {
    await this.request('DELETE', `/subscriptions/${id}`)
  }

  // --- One-off Payments ---

  async createPayment(data: AsaasPaymentInput): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('POST', '/payments', data)
  }

  async getPayment(id: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('GET', `/payments/${id}`)
  }

  // --- Private ---

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      let errorMessage = `Asaas API error: HTTP ${response.status}`
      try {
        const errorData = (await response.json()) as AsaasErrorResponse
        if (errorData.errors?.length) {
          errorMessage = errorData.errors.map((e) => e.description).join(', ')
        }
      } catch {
        // ignore parse errors
      }
      throw new Error(errorMessage)
    }

    // DELETE responses may have no body
    if (response.status === 204 || method === 'DELETE') {
      return {} as T
    }

    return (await response.json()) as T
  }
}

// --- Factory ---

export function isAsaasConfigured(): boolean {
  return !!process.env.ASAAS_API_KEY
}

export function createAsaasClient(): AsaasClient {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) {
    throw new Error(
      'Gateway de pagamento nao configurado. Configure ASAAS_API_KEY no arquivo .env.local para habilitar cobrancas.'
    )
  }

  const sandbox = process.env.ASAAS_SANDBOX === 'true'

  return new AsaasClient(apiKey, sandbox)
}
