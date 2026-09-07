-- =====================================================================================
-- 012_inbox_newsletter_email.sql
-- Customer support inbox, newsletter subscriptions, and outbound email logging.
-- SMTP credentials are NEVER stored here — they live in server-side environment
-- variables / Supabase secrets, consumed only inside Edge Functions.
-- =====================================================================================

create table conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  order_id uuid references orders(id),
  category conversation_category not null default 'support',
  subject text,
  status conversation_status not null default 'open',
  assigned_admin_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_conversations_customer on conversations(customer_id, updated_at desc);
create index idx_conversations_status on conversations(status);
create index idx_conversations_assigned on conversations(assigned_admin_id);

create trigger trg_conversations_updated_at
  before update on conversations for each row execute function set_updated_at();

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_type message_sender_type not null,
  sender_id uuid references profiles(id),
  body text not null,
  attachment_url text,
  is_internal_note boolean not null default false,   -- staff-only notes, never shown to customer
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on messages(conversation_id, created_at);

create or replace function touch_conversation_on_message()
returns trigger
language plpgsql
as $$
begin
  update conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_messages_touch_conversation
  after insert on messages
  for each row execute function touch_conversation_on_message();

-- ---------- NEWSLETTER ----------
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  customer_id uuid references profiles(id),
  status text not null default 'subscribed' check (status in ('subscribed','unsubscribed')),
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one ACTIVE subscription per email; resubscribes update the existing row.
create unique index uq_newsletter_active_email
  on newsletter_subscribers (lower(email)) where status = 'subscribed';

create trigger trg_newsletter_updated_at
  before update on newsletter_subscribers for each row execute function set_updated_at();

-- ---------- EMAIL LOGS (transactional email audit trail; SMTP itself lives in Edge Functions) ----------
create table email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  customer_id uuid references profiles(id),
  email_type email_type not null,
  related_order_id uuid references orders(id),
  status email_status not null default 'queued',
  provider_reference text,
  failure_reason text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_email_logs_recipient on email_logs(recipient_email, created_at desc);
create index idx_email_logs_type_status on email_logs(email_type, status);
