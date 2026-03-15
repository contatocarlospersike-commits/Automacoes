'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toggleOrganizationStatus } from '@/features/admin/actions'

interface ToggleOrgButtonProps {
  orgId: string
  isActive: boolean
}

export function ToggleOrgButton({ orgId, isActive }: ToggleOrgButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      await toggleOrganizationStatus(orgId)
      router.refresh()
    } catch (error) {
      console.error('Failed to toggle org status:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={handleToggle}
      className={
        isActive
          ? 'border-[rgba(244,63,94,0.3)] text-[#F43F5E] hover:bg-[rgba(244,63,94,0.1)]'
          : 'border-[rgba(16,185,129,0.3)] text-[#10B981] hover:bg-[rgba(16,185,129,0.1)]'
      }
    >
      {loading ? 'Processando...' : isActive ? 'Desativar' : 'Ativar'}
    </Button>
  )
}
