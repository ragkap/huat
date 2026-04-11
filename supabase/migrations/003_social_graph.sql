-- Social graph: follow + connect
CREATE TABLE IF NOT EXISTS public.social_graph (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rel_type    TEXT NOT NULL CHECK (rel_type IN ('follow','connect_request','connect')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(actor_id, subject_id, rel_type)
);

CREATE INDEX IF NOT EXISTS sg_actor_idx ON public.social_graph(actor_id, rel_type);
CREATE INDEX IF NOT EXISTS sg_subject_idx ON public.social_graph(subject_id, rel_type);

ALTER TABLE public.social_graph ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Social graph visible to authenticated users" ON public.social_graph FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage own graph edges" ON public.social_graph FOR INSERT WITH CHECK (auth.uid() = actor_id);
CREATE POLICY "Users can delete own edges" ON public.social_graph FOR DELETE USING (auth.uid() = actor_id OR auth.uid() = subject_id);
