-- Stories reais da comunidade KORA, vinculados ao banco isolado VIRA-APP.
CREATE TABLE IF NOT EXISTS public.stories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 image_path text NOT NULL CHECK (char_length(image_path) between 3 and 300),
 caption text NOT NULL DEFAULT '' CHECK (char_length(caption)<=250),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
 CONSTRAINT stories_expiry_limit CHECK (expires_at > created_at AND expires_at <= created_at + interval '24 hours')
);
CREATE INDEX IF NOT EXISTS stories_active_idx ON public.stories (expires_at DESC,created_at DESC);
CREATE INDEX IF NOT EXISTS stories_author_idx ON public.stories (author_id,created_at DESC);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stories active read for members" ON public.stories FOR SELECT TO authenticated USING (expires_at>now());
CREATE POLICY "stories own create" ON public.stories FOR INSERT TO authenticated WITH CHECK (
 author_id=(select auth.uid()) AND expires_at <= now() + interval '24 hours' AND expires_at > now()
);
CREATE POLICY "stories own delete" ON public.stories FOR DELETE TO authenticated USING (author_id=(select auth.uid()));
REVOKE ALL ON public.stories FROM anon;
GRANT SELECT,INSERT,DELETE ON public.stories TO authenticated;
COMMENT ON TABLE public.stories IS 'KORA: stories reais de fotos com duração máxima de 24 horas; mídia no bucket vira-media.';
