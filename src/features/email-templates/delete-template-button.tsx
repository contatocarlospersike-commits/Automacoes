'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteEmailTemplate } from '@/features/email-templates/actions'

export function DeleteEmailTemplateButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const r = await deleteEmailTemplate(id)
          if (r.success) toast.success('Template removido')
          else toast.error(r.error ?? 'Erro ao remover')
        })
      }
      className="h-7 w-7 text-[#737373] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </Button>
  )
}
