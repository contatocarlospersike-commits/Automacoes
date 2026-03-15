'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, X, Loader2, Tag } from 'lucide-react'
import { createTag, deleteTag } from '@/features/tags/actions'
import type { Database } from '@/types/database'

type ContactTag = Database['public']['Tables']['contact_tags']['Row'] & {
  contact_tag_assignments: [{ count: number }]
}

const COLOR_OPTIONS = [
  '#7C3AED',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#F43F5E',
  '#6B7280',
]

interface TagsManagerProps {
  tags: ContactTag[]
}

export function TagsManager({ tags }: TagsManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(COLOR_OPTIONS[0])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = () => {
    if (!newTagName.trim()) return
    startTransition(async () => {
      const result = await createTag(newTagName, newTagColor)
      if (result.success) {
        toast.success('Tag criada')
        setNewTagName('')
      } else {
        toast.error(result.error ?? 'Erro ao criar tag')
      }
    })
  }

  const handleDelete = (tagId: string) => {
    setDeletingId(tagId)
    startTransition(async () => {
      const result = await deleteTag(tagId)
      if (result.success) {
        toast.success('Tag removida')
      } else {
        toast.error(result.error ?? 'Erro ao remover tag')
      }
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-6">
      {/* Create */}
      <div className="bg-[#1E293B] rounded-xl border border-white/5 p-5 space-y-4">
        <p className="text-sm font-semibold text-[#FAFAFA]">Nova Tag</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Nome da tag"
              className="bg-[#0F172A] border-white/10 text-[#FAFAFA] placeholder:text-[#737373]"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="flex gap-1.5">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewTagColor(c)}
                className="h-7 w-7 rounded-full transition-all"
                style={{
                  backgroundColor: c,
                  outline: newTagColor === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
          <Button
            onClick={handleCreate}
            disabled={!newTagName.trim() || isPending}
            className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* List */}
      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Tag className="h-8 w-8 text-[#525252] mb-3" />
          <p className="text-[#737373] text-sm">Nenhuma tag criada ainda</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const count = tag.contact_tag_assignments?.[0]?.count ?? 0
            return (
              <div
                key={tag.id}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
                style={{ backgroundColor: tag.color + '22', border: `1px solid ${tag.color}44`, color: tag.color }}
              >
                <span>{tag.name}</span>
                <span
                  className="text-xs opacity-60 ml-0.5"
                  style={{ color: tag.color }}
                >
                  {count}
                </span>
                <button
                  onClick={() => handleDelete(tag.id)}
                  disabled={deletingId === tag.id}
                  className="ml-1 hover:opacity-100 opacity-50 transition-opacity"
                >
                  {deletingId === tag.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
