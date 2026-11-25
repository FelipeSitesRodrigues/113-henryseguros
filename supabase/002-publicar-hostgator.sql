-- 2026-11-25: o site saiu da Vercel e foi pra HostGator do Paulo.
-- O botão Publicar agora dispara o GitHub Action "Publicar na HostGator" (evento repository_dispatch
-- "publicar"), que monta o site com o conteúdo do painel e sobe por FTP.
-- O token do GitHub fica em public.privado (chave github_token), fora do alcance do navegador:
--   insert into public.privado values ('github_token', '<token>') on conflict (chave) do update set valor = excluded.valor;
-- Sem o token, cai no deploy hook da Vercel (prévia antiga), como antes.

create or replace function public.publicar() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  token text;
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

  select valor into token from public.privado where chave = 'github_token';
  if token is not null then
    perform net.http_post(
      url := 'https://api.github.com/repos/FelipeSitesRodrigues/113-henryseguros/dispatches',
      body := '{"event_type":"publicar"}'::jsonb,
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || token,
        'Accept', 'application/vnd.github+json',
        'X-GitHub-Api-Version', '2022-11-28',
        'User-Agent', 'henry-seguros-painel',
        'Content-Type', 'application/json'
      )
    );
    insert into public.publicacoes (por, ok, detalhe) values (auth.uid(), true, 'publicação pedida ao GitHub (HostGator)');
    return jsonb_build_object('ok', true, 'mensagem', 'Publicação iniciada. O site atualiza em cerca de 3 minutos.');
  end if;

  select valor into gancho from public.privado where chave = 'vercel_deploy_hook';
  if gancho is null then
    insert into public.publicacoes (por, ok, detalhe) values (auth.uid(), false, 'publicação não configurada');
    return jsonb_build_object('ok', false, 'mensagem', 'Publicação não configurada. Avise o Felipe.');
  end if;
  perform net.http_post(url := gancho, body := '{}'::jsonb);
  insert into public.publicacoes (por, ok, detalhe) values (auth.uid(), true, 'deploy pedido à Vercel');
  return jsonb_build_object('ok', true, 'mensagem', 'Publicação iniciada. O site atualiza em cerca de 2 minutos.');
end $$;

revoke execute on function public.publicar() from public, anon;
grant execute on function public.publicar() to authenticated;
