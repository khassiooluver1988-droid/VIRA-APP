-- KLIX — avatar seguro sem criar novo projeto ou modificar usuarios existentes.
alter table public.profiles add constraint klix_avatar_own_folder
  check (avatar_path is null or
    (avatar_path like id::text || '/avatars/%' and char_length(avatar_path)<=220));
comment on column public.profiles.avatar_path is
  'Foto de perfil publica armazenada no bucket vira-media em {user_id}/avatars/{uuid}.jpg';
