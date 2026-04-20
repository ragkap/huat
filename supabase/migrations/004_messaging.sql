-- Message threads
CREATE TABLE IF NOT EXISTS public.message_threads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  last_msg_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thread participants
CREATE TABLE IF NOT EXISTS public.thread_participants (
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS tp_user_idx ON public.thread_participants(user_id);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_thread_idx ON public.messages(thread_id, created_at DESC);

-- RLS
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Threads: only participants can view"
  ON public.message_threads FOR SELECT
  USING (
    id IN (
      SELECT thread_id FROM public.thread_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Thread participants: only members can view"
  ON public.thread_participants FOR SELECT
  USING (
    thread_id IN (
      SELECT thread_id FROM public.thread_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Messages: only participants can view"
  ON public.messages FOR SELECT
  USING (
    thread_id IN (
      SELECT thread_id FROM public.thread_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Messages: participants can insert"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    thread_id IN (
      SELECT thread_id FROM public.thread_participants WHERE user_id = auth.uid()
    )
  );

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
