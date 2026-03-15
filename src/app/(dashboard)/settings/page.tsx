import { WabaConfigForm } from '@/features/settings/waba-config-form'
import { getWabaConfig } from '@/features/settings/actions'

export default async function SettingsPage() {
  const config = await getWabaConfig()

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Configuracoes
        </h1>
        <p className="mt-1 text-sm font-medium text-white/70">
          Credenciais da WhatsApp Business API. Token, numero, webhook.
        </p>
      </div>

      <WabaConfigForm existingConfig={config} />
    </div>
  )
}
