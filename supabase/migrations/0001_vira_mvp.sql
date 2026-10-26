-- VIRA MVP | Exclusivo para um projeto Supabase VIRA | NÃO EXECUTADO.
-- Verificar políticas RLS e testes multiusuário antes de qualquer piloto.

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 80),
 bio text check (bio is null or char_length(bio) <= 400),
 avatar_url text,
 created_at timestamptz not null default now()
);
create table public.posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null check (kind in ('video', 'text')),
 caption text not null check (char_length(caption) between 1 and 1200),
 media_url text,
 created_at timestamptz not null default now(),
 constraint video_requires_media check (kind <> 'video' or nullif(trim(media_url), '') is not null)
);
create table public.comments (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.posts(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check (char_length(body) between 1 and 1000),
 created_at timestamptz not null default now()
);
create table public.post_likes (
 post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(post_id, user_id)
);
create table public.help_requests (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check (char_length(title) between 5 and 120),
 description text not null check (char_length(description) between 10 and 3000),
 category text not null check (char_length(category) between 2 and 60),
 status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'closed')),
 created_at timestamptz not null default now()
);
create table public.help_answers (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.help_requests(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check (char_length(body) between 1 and 2000),
 created_at timestamptz not null default now()
);
create table public.reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references public.profiles(id) on delete cascade,
 post_id uuid references public.posts(id) on delete set null,
 request_id uuid references public.help_requests(id) on delete set null,
 reason text not null check (char_length(reason) between 10 and 1000),
 created_at timestamptz not null default now(),
 constraint report_has_target check (post_id is not null or request_id is not null)
);
create index posts_author_idx on public.posts(author_id,created_at desc);
create index posts_recent_idx on public.posts(created_at desc);
create index comments_post_idx on public.comments(post_id,created_at);
create index comments_author_idx on public.comments(author_id);
create index post_likes_user_idx on public.post_likes(user_id);
create index requests_recent_idx on public.help_requests(created_at desc);
create index requests_author_idx on public.help_requests(author_id,created_at desc);
create index answers_request_idx on public.help_answers(request_id,created_at);
create index answers_author_idx on public.help_answers(author_id);
create index reports_reporter_idx on public.reports(reporter_id);
create index reports_post_idx on public.reports(post_id);
create index reports_request_idx on public.reports(request_id);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.help_requests enable row level security;
alter table public.help_answers enable row level security;
alter table public.reports enable row level security;

revoke all on public.profiles,public.posts,public.comments,public.post_likes,
 public.help_requests,public.help_answers,public.reports from public,anon,authenticated;
grant select,insert,update on public.profiles to authenticated;
grant select,insert,delete on public.posts to authenticated;
grant select,insert,delete on public.comments to authenticated;
grant select,insert,delete on public.post_likes to authenticated;
grant select,insert,update,delete on public.help_requests to authenticated;
grant select,insert,delete on public.help_answers to authenticated;
grant insert on public.reports to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_create_own on public.profiles for insert to authenticated with check ((select auth.uid())=id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy posts_read on public.posts for select to authenticated using (true);
create policy posts_insert_own on public.posts for insert to authenticated with check ((select auth.uid())=author_id);
create policy posts_delete_own on public.posts for delete to authenticated using ((select auth.uid())=author_id);
create policy comments_read on public.comments for select to authenticated using (true);
create policy comments_insert_own on public.comments for insert to authenticated with check ((select auth.uid())=author_id);
create policy comments_delete_own on public.comments for delete to authenticated using ((select auth.uid())=author_id);
create policy likes_read on public.post_likes for select to authenticated using (true);
create policy likes_insert_own on public.post_likes for insert to authenticated with check ((select auth.uid())=user_id);
create policy likes_delete_own on public.post_likes for delete to authenticated using ((select auth.uid())=user_id);
create policy requests_read on public.help_requests for select to authenticated using (true);
create policy requests_insert_own on public.help_requests for insert to authenticated with check ((select auth.uid())=author_id);
create policy requests_update_own on public.help_requests for update to authenticated using ((select auth.uid())=author_id) with check ((select auth.uid())=author_id);
create policy requests_delete_own on public.help_requests for delete to authenticated using ((select auth.uid())=author_id);
create policy answers_read on public.help_answers for select to authenticated using (true);
create policy answers_insert_own on public.help_answers for insert to authenticated with check ((select auth.uid())=author_id);
create policy answers_delete_own on public.help_answers for delete to authenticated using ((select auth.uid())=author_id);
create policy reports_insert_own on public.reports for insert to authenticated with check ((select auth.uid())=reporter_id);
-- TODO: RLS testes com A/B; controles de spam, exclusão de conta e moderação
