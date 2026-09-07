import { supabase } from '@/lib/supabase'
import type { Order, OrderStatusHistory } from '@/types/domain'

export async function listAdminOrders(params: {
  status?: Order['status']
  search?: string
  page?: number
  pageSize?: number
}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('orders').select('*, profiles(full_name, email)', { count: 'exact' }).order('created_at', {
    ascending: false,
  })

  if (params.status) query = query.eq('status', params.status)
  if (params.search) query = query.ilike('order_number', `%${params.search}%`)

  const { data, error, count } = await query.range(from, to)
  if (error) throw error
  return { items: data ?? [], total: count ?? 0, page, pageSize }
}

export async function getAdminOrderDetail(orderId: string) {
  const [{ data: order, error: orderErr }, { data: items, error: itemsErr }, { data: history, error: historyErr }, { data: payments }] =
    await Promise.all([
      supabase.from('orders').select('*, profiles(full_name, email, phone)').eq('id', orderId).single(),
      supabase.from('order_items').select('*').eq('order_id', orderId),
      supabase.from('order_status_history').select('*').eq('order_id', orderId).order('created_at'),
      supabase.from('payments').select('*').eq('order_id', orderId),
    ])
  if (orderErr) throw orderErr
  if (itemsErr) throw itemsErr
  if (historyErr) throw historyErr

  return { order, items: items ?? [], history: (history ?? []) as OrderStatusHistory[], payments: payments ?? [] }
}

export async function updateOrderStatus(orderId: string, status: Order['status'], note?: string): Promise<void> {
  const { error } = await supabase.from('orders').update({ status, notes: note }).eq('id', orderId)
  if (error) throw error
  // order_status_history is populated automatically by trg_orders_status_history (009).
}
