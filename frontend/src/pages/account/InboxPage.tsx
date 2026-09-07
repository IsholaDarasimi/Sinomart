import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function InboxPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState('')

  const conversationsQuery = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('customer_id', user!.id)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const messagesQuery = useQuery({
    queryKey: ['messages', activeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeId!)
        .eq('is_internal_note', false)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!activeId,
  })

  async function sendMessage() {
    if (!draft.trim() || !activeId || !user) return
    await supabase.from('messages').insert({
      conversation_id: activeId,
      sender_type: 'customer',
      sender_id: user.id,
      body: draft.trim(),
    })
    setDraft('')
    queryClient.invalidateQueries({ queryKey: ['messages', activeId] })
  }

  const conversations = conversationsQuery.data ?? []

  return (
    <div className="grid gap-4 rounded-xl border border-ink-900/8 bg-white sm:grid-cols-3">
      <div className="divide-y divide-ink-900/8 sm:border-r sm:border-ink-900/8">
        {conversations.length === 0 && <p className="p-4 text-sm text-ink-500">No messages yet.</p>}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={cn('block w-full p-4 text-left hover:bg-surface-muted', activeId === c.id && 'bg-brand-50')}
          >
            <p className="text-sm font-medium text-ink-900">{c.subject ?? c.category}</p>
            <p className="text-xs text-ink-500">{formatDateTime(c.updated_at)}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:col-span-2">
        {!activeId ? (
          <p className="p-6 text-sm text-ink-500">Select a conversation to view messages.</p>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {(messagesQuery.data ?? []).map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'max-w-xs rounded-lg p-3 text-sm',
                    m.sender_type === 'customer' ? 'ml-auto bg-brand-500 text-white' : 'bg-surface-muted text-ink-900',
                  )}
                >
                  {m.body}
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-ink-900/8 p-3">
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message..." />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
