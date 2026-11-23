-- Henry Seguros: banco do painel administrativo e do blog (2026-11-23).
-- O site continua estático: o build (build.mjs) lê daqui com a chave pública e gera as páginas.
-- O painel (/painel) grava aqui com o login do Paulo. O botão Publicar chama publicar(), que
-- dispara o deploy hook da Vercel (guardado em privado, fora do alcance do navegador).

create extension if not exists pg_net;

-- ---------------------------------------------------------------- quem pode editar
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade,
  nome text not null default '',
  criado_em timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

drop policy if exists "admin vê a própria linha" on public.admins;
create policy "admin vê a própria linha" on public.admins for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------- blog
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo text not null check (length(titulo) between 3 and 160),
  resumo text not null default '',
  conteudo text not null default '',
  capa_url text,
  capa_alt text not null default '',
  categoria text not null default 'Notícias',
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  publicado_em timestamptz,
  seo_titulo text,
  seo_descricao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.posts enable row level security;

create or replace function public.tocar_atualizado() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  if new.status = 'publicado' and new.publicado_em is null then new.publicado_em := now(); end if;
  return new;
end $$;
drop trigger if exists posts_atualizado on public.posts;
create trigger posts_atualizado before insert or update on public.posts for each row execute function public.tocar_atualizado();

drop policy if exists "público lê post publicado" on public.posts;
create policy "público lê post publicado" on public.posts for select to anon, authenticated using (status = 'publicado' or public.eh_admin());
drop policy if exists "admin cria post" on public.posts;
create policy "admin cria post" on public.posts for insert to authenticated with check (public.eh_admin());
drop policy if exists "admin edita post" on public.posts;
create policy "admin edita post" on public.posts for update to authenticated using (public.eh_admin()) with check (public.eh_admin());
drop policy if exists "admin apaga post" on public.posts;
create policy "admin apaga post" on public.posts for delete to authenticated using (public.eh_admin());

-- ---------------------------------------------------------------- conteúdo do site
-- Uma linha por bloco: textos, imagens, contato, depoimentos, faq. O valor só guarda o que o
-- Paulo mudou; o que falta vem do padrão que está no código.
create table if not exists public.conteudo (
  chave text primary key check (chave in ('textos', 'imagens', 'contato', 'depoimentos', 'faq')),
  valor jsonb not null,
  atualizado_em timestamptz not null default now()
);
alter table public.conteudo enable row level security;

drop policy if exists "público lê conteúdo" on public.conteudo;
create policy "público lê conteúdo" on public.conteudo for select to anon, authenticated using (true);
drop policy if exists "admin grava conteúdo" on public.conteudo;
create policy "admin grava conteúdo" on public.conteudo for insert to authenticated with check (public.eh_admin());
drop policy if exists "admin edita conteúdo" on public.conteudo;
create policy "admin edita conteúdo" on public.conteudo for update to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- ---------------------------------------------------------------- publicação (deploy na Vercel)
create table if not exists public.privado (chave text primary key, valor text not null);
alter table public.privado enable row level security; -- sem política: só service_role e funções

create table if not exists public.publicacoes (
  id bigint generated always as identity primary key,
  pedido_em timestamptz not null default now(),
  por uuid,
  ok boolean not null,
  detalhe text not null default ''
);
alter table public.publicacoes enable row level security;
drop policy if exists "admin vê publicações" on public.publicacoes;
create policy "admin vê publicações" on public.publicacoes for select to authenticated using (public.eh_admin());

create or replace function public.publicar() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  gancho text;
  ultima timestamptz;
begin
  if not public.eh_admin() then
    return jsonb_build_object('ok', false, 'mensagem', 'Sem permissão para publicar.');
  end if;
  select max(pedido_em) into ultima from public.publicacoes where ok;
  if ultima is not null and ultima > now() - interval '60 seconds' then
    return jsonb_build_object('ok', false, 'mensagem', 'O site já está sendo atualizado. Espere um minuto antes de publicar de novo.');
  end if;
  select valor into gancho from public.privado where chave = 'vercel_deploy_hook';
  if gancho is null then
    insert into public.publicacoes (por, ok, detalhe) values (auth.uid(), false, 'deploy hook não configurado');
    return jsonb_build_object('ok', false, 'mensagem', 'Publicação não configurada. Avise o Felipe.');
  end if;
  perform net.http_post(url := gancho, body := '{}'::jsonb);
  insert into public.publicacoes (por, ok, detalhe) values (auth.uid(), true, 'deploy pedido à Vercel');
  return jsonb_build_object('ok', true, 'mensagem', 'Publicação iniciada. O site atualiza em cerca de 2 minutos.');
end $$;

-- ---------------------------------------------------------------- permissões (projeto novo não dá grant sozinho)
revoke all on public.admins, public.posts, public.conteudo, public.privado, public.publicacoes from anon, authenticated;
grant select on public.posts, public.conteudo to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
grant insert, update on public.conteudo to authenticated;
grant select on public.admins, public.publicacoes to authenticated;
grant all on public.admins, public.posts, public.conteudo, public.privado, public.publicacoes to service_role;
revoke execute on function public.publicar() from public, anon;
grant execute on function public.publicar() to authenticated;
grant execute on function public.eh_admin() to anon, authenticated;

-- ---------------------------------------------------------------- imagens (Storage)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('midia', 'midia', true, 8388608, array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin lista mídia" on storage.objects;
create policy "admin lista mídia" on storage.objects for select to authenticated using (bucket_id = 'midia' and public.eh_admin());
drop policy if exists "admin envia mídia" on storage.objects;
create policy "admin envia mídia" on storage.objects for insert to authenticated with check (bucket_id = 'midia' and public.eh_admin());
drop policy if exists "admin troca mídia" on storage.objects;
create policy "admin troca mídia" on storage.objects for update to authenticated using (bucket_id = 'midia' and public.eh_admin());
drop policy if exists "admin apaga mídia" on storage.objects;
create policy "admin apaga mídia" on storage.objects for delete to authenticated using (bucket_id = 'midia' and public.eh_admin());
