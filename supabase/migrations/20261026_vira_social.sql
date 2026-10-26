-- VIRA Social — MVP de cadastro e comunidade. Projeto Supabase EXCLUSIVO do VIRA.
-- Não executar em projetos de outras iniciativas.
create schema if not exists vira_private;
revoke all on schema vira_private from public, anon, authenticated;

create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z][a-z0-9_.]{2,23}$'),
 display_name text not null check (char_length(display_name) between 2 and 70),
 bio text not null default '' check (char_length(bio)<=220),
 avatar_path text,
 created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_idx on public.profiles(lower(username));
create table if not exists public.posts(
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 caption text not null check (char_length(trim(caption)) between 1 and 2200),
 image_path text,
 created_at timestamptz not null default now()
);
create index if not exists posts_recent_idx on public.posts(created_at desc);
create index if not exists posts_author_idx on public.posts(author_id,created_at desc);

create table if not exists public.follows(
 follower_id uuid not null references public.profiles(id) on delete cascade,
 following_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (follower_id,following_id),
 check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows(following_id);
create table if not exists public.likes(
 post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(post_id,user_id)
);
create index if not exists likes_user_idx on public.likes(user_id);
create table if not exists public.comments(
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.posts(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 800),
 created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments(post_id,created_at asc);
create index if not exists comments_author_idx on public.comments(author_id);

create table if not exists public.help_requests(
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(char_length(trim(title)) between 5 and 120),
 category text not null default 'Comunidade' check (category in ('Comunidade','Trabalho','Serviços','Aprendizagem','Empreendedorismo')),
 description text not null check(char_length(trim(description)) between 10 and 2500),
 status text not null default 'open' check (status in ('open','resolved')),
 created_at timestamptz not null default now()
);
create index if not exists help_requests_recent_idx on public.help_requests(created_at desc);
create table if not exists public.help_answers(
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.help_requests(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 2 and 1500),
 created_at timestamptz not null default now()
);
create index if not exists help_answers_request_idx on public.help_answers(request_id,created_at);
create table if not exists public.direct_messages(
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 1200),
 created_at timestamptz not null default now(),
 check(sender_id <> recipient_id)
);
create index if not exists direct_messages_pair_idx on public.direct_messages(sender_id,recipient_id,created_at desc);
create index if not exists direct_messages_recipient_idx on public.direct_messages(recipient_id,created_at desc);
create table if not exists public.reports(
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references public.profiles(id) on delete cascade,
 post_id uuid references public.posts(id) on delete set null,
 reported_user_id uuid references public.profiles(id) on delete set null,
 reason text not null check (char_length(trim(reason)) between 5 and 500),
 created_at timestamptz not null default now(),
 check (post_id is not null or reported_user_id is not null)
);

create or replace function vira_private.create_profile_for_user()
returns trigger language plpgsql security definer set search_path = pg_catalog,public
as $$
begin
  insert into public.profiles(id,username,display_name)
  values(new.id,'vira_'||left(replace(new.id::text,'-',''),18), left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'Novo usuário'),70));
  return new;
end;
$$;
revoke all on function vira_private.create_profile_for_user() from public,anon,authenticated;
drop trigger if exists vira_create_profile on auth.users;
create trigger vira_create_profile after insert on auth.users for each row execute function vira_private.create_profile_for_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.help_requests enable row level security;
alter table public.help_answers enable row level security;
alter table public.direct_messages enable row level security;
alter table public.reports enable row level security;

create policy "profiles read signed members" on public.profiles for select to authenticated using(true);
create policy "profiles update self" on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy "posts read members" on public.posts for select to authenticated using(true);
create policy "posts insert own" on public.posts for insert to authenticated with check(author_id=(select auth.uid()));
create policy "posts update own" on public.posts for update to authenticated using(author_id=(select auth.uid())) with check(author_id=(select auth.uid()));
create policy "posts delete own" on public.posts for delete to authenticated using(author_id=(select auth.uid()));
create policy "follows read members" on public.follows for select to authenticated using(true);
create policy "follows insert self" on public.follows for insert to authenticated with check(follower_id=(select auth.uid()));
create policy "follows delete self" on public.follows for delete to authenticated using(follower_id=(select auth.uid()));
create policy "likes read members" on public.likes for select to authenticated using(true);
create policy "likes own insert" on public.likes for insert to authenticated with check(user_id=(select auth.uid()));
create policy "likes own delete" on public.likes for delete to authenticated using(user_id=(select auth.uid()));
create policy "comments read members" on public.comments for select to authenticated using(true);
create policy "comments own insert" on public.comments for insert to authenticated with check(author_id=(select auth.uid()));
create policy "comments own update" on public.comments for update to authenticated using(author_id=(select auth.uid())) with check(author_id=(select auth.uid()));
create policy "comments own delete" on public.comments for delete to authenticated using(author_id=(select auth.uid()));
create policy "requests read members" on public.help_requests for select to authenticated using(true);
create policy "requests own insert" on public.help_requests for insert to authenticated with check(author_id=(select auth.uid()));
create policy "requests own update" on public.help_requests for update to authenticated using(author_id=(select auth.uid())) with check(author_id=(select auth.uid()));
create policy "requests own delete" on public.help_requests for delete to authenticated using(author_id=(select auth.uid()));
create policy "answers read members" on public.help_answers for select to authenticated using(true);
create policy "answers own insert" on public.help_answers for insert to authenticated with check(author_id=(select auth.uid()));
create policy "answers own delete" on public.help_answers for delete to authenticated using(author_id=(select auth.uid()));
create policy "dm read participants" on public.direct_messages for select to authenticated using(sender_id=(select auth.uid()) or recipient_id=(select auth.uid()));
create policy "dm insert sender" on public.direct_messages for insert to authenticated with check(sender_id=(select auth.uid()));
create policy "reports insert reporter" on public.reports for insert to authenticated with check(reporter_id=(select auth.uid()));

-- Cadastro nas redes não deve ficar aberto para anônimos; permissões públicas são desabilitadas.
revoke all on public.profiles,public.posts,public.follows,public.likes,public.comments,public.help_requests,public.help_answers,public.direct_messages,public.reports from anon;
grant usage on schema public to authenticated;
grant select on public.profiles,public.posts,public.follows,public.likes,public.comments,public.help_requests,public.help_answers,public.direct_messages to authenticated;
grant update(username,display_name,bio,avatar_path) on public.profiles to authenticated;
grant insert,update,delete on public.posts to authenticated;
grant insert,delete on public.follows,public.likes to authenticated;
grant insert,update,delete on public.comments to authenticated;
grant insert,update,delete on public.help_requests to authenticated;
grant insert,delete on public.help_answers to authenticated;
grant insert on public.direct_messages,public.reports to authenticated;

-- Fotos em bucket público: links de imagens enviados poderão ser vistos por quem tiver a URL.
-- Cada usuário só envia e exclui arquivos na própria pasta; máximo 5 MB; imagens JPEG/PNG/WebP.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('vira-media','vira-media',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy "vira own media insert" on storage.objects for insert to authenticated
with check(bucket_id='vira-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "vira own media delete" on storage.objects for delete to authenticated
using(bucket_id='vira-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "vira media signed read" on storage.objects for select to authenticated
using(bucket_id='vira-media');
