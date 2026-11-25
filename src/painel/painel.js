// Painel da Henry Seguros: entrada, menu, rotas e a tela Início.
import { app, carregarConteudo, marcarSujo, publicarSite, temPendente, traduzErro, ultimaPublicacao } from './app.js'
import { $, $$, aviso, confirmar, esc, ocupado, quando } from './util.js'
import { icone } from './icones.js'
import { telaBlog, telaPost } from './blog.js'
import { telaTextos, telaImagens, telaDepoimentos, telaFaq, telaContato } from './conteudo.js'

const SECOES = [
  { rota: 'inicio', nome: 'Início', icone: 'house', tela: telaInicio },
  { rota: 'blog', nome: 'Blog', icone: 'newspaper', tela: telaBlog },
  { rota: 'textos', nome: 'Textos do site', curto: 'Textos', icone: 'text-aa', tela: telaTextos },
  { rota: 'imagens', nome: 'Imagens', icone: 'image', tela: telaImagens },
  { rota: 'depoimentos', nome: 'Depoimentos', icone: 'quotes', tela: telaDepoimentos },
  { rota: 'faq', nome: 'Perguntas frequentes', curto: 'Perguntas', icone: 'question', tela: telaFaq },
  { rota: 'contato', nome: 'Contato', icone: 'address-book', tela: telaContato },
]
const NA_BARRA = ['inicio', 'blog', 'textos', 'imagens'] // o resto vai no "Mais" do celular

// o link de recuperação de senha chega com #...type=recovery; guardar antes do Supabase limpar a URL
const hashInicial = location.hash
const veioRecuperar = /type=recovery/.test(hashInicial)
const erroNoLink = /error_description=([^&]+)/.exec(hashInicial)

iniciar()

async function iniciar() {
  try {
    app.cfg = await lerConfig()
  } catch (e) {
    $('#carregando').innerHTML = '<span>Não consegui carregar a configuração do painel. Recarregue a página.</span>'
    console.error(e)
    return
  }
  app.sb = supabase.createClient(app.cfg.url, app.cfg.chave, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  prepararEntrada()

  let emRecuperacao = veioRecuperar
  app.sb.auth.onAuthStateChange((evento) => {
    if (evento === 'PASSWORD_RECOVERY') { emRecuperacao = true; mostrarEntrada('nova') }
    if (evento === 'SIGNED_OUT') mostrarEntrada('entrar')
  })

  const { data } = await app.sb.auth.getSession()
  if (erroNoLink) {
    mostrarEntrada('entrar')
    erroForm('entrar', /expired|invalid/i.test(decodeURIComponent(erroNoLink[1])) ? 'Esse link expirou ou já foi usado. Peça um novo em "Esqueci a senha".' : 'Não consegui abrir esse link. Peça um novo em "Esqueci a senha".')
    history.replaceState(null, '', location.pathname)
    return
  }
  if (emRecuperacao) { mostrarEntrada('nova'); return }
  if (data.session) await entrarNoPainel()
  else mostrarEntrada('entrar')
}

async function lerConfig() {
  let r = await fetch(new URL('config.json', import.meta.url), { cache: 'no-store' })
  if (r.status === 404) r = await fetch(new URL('config.exemplo.json', import.meta.url), { cache: 'no-store' })
  if (!r.ok) throw new Error('config ' + r.status)
  return r.json()
}

/* ================================================================= entrada */
function mostrarEntrada(qual) {
  $('#carregando').hidden = true
  $('#casca').hidden = true
  $('#entrada').hidden = false
  for (const f of ['entrar', 'esqueci', 'nova']) $(`#form-${f}`).hidden = f !== qual
  const foco = { entrar: '#entrar-email', esqueci: '#esqueci-email', nova: '#nova-senha' }[qual]
  setTimeout(() => $(foco)?.focus(), 30)
}

function erroForm(f, texto) {
  const el = $(`#${f}-erro`)
  el.textContent = texto || ''
  el.hidden = !texto
}

function prepararEntrada() {
  // mostrar e esconder a senha
  for (const b of $$('[data-ver-senha]')) {
    const inp = b.previousElementSibling
    const pinta = () => {
      const visivel = inp.type === 'text'
      b.innerHTML = icone(visivel ? 'eye-slash' : 'eye')
      b.setAttribute('aria-label', visivel ? 'Esconder senha' : 'Mostrar senha')
    }
    b.addEventListener('click', () => { inp.type = inp.type === 'password' ? 'text' : 'password'; pinta() })
    pinta()
  }

  $('#form-entrar').addEventListener('submit', async ev => {
    ev.preventDefault()
    const email = $('#entrar-email').value.trim()
    const senha = $('#entrar-senha').value
    if (!email || !senha) return erroForm('entrar', 'Preencha o e-mail e a senha.')
    erroForm('entrar', '')
    await ocupado(ev.submitter || $('#form-entrar button[type=submit]'), async () => {
      const { error } = await app.sb.auth.signInWithPassword({ email, password: senha })
      if (error) {
        erroForm('entrar', /invalid login credentials/i.test(error.message) ? 'E-mail ou senha incorretos.'
          : /email not confirmed/i.test(error.message) ? 'Esse e-mail ainda não foi confirmado.' : traduzErro(error))
        return
      }
      $('#entrar-senha').value = ''
      await entrarNoPainel()
    })
  })

  $('#ir-esqueci').addEventListener('click', () => {
    $('#esqueci-email').value = $('#entrar-email').value
    $('#esqueci-ok').hidden = true
    erroForm('esqueci', '')
    mostrarEntrada('esqueci')
  })
  $('#voltar-entrar').addEventListener('click', () => mostrarEntrada('entrar'))

  $('#form-esqueci').addEventListener('submit', async ev => {
    ev.preventDefault()
    const email = $('#esqueci-email').value.trim()
    if (!/^\S+@\S+\.\S+$/.test(email)) return erroForm('esqueci', 'Digite um e-mail válido.')
    erroForm('esqueci', '')
    await ocupado(ev.submitter || $('#form-esqueci button[type=submit]'), async () => {
      const { error } = await app.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/painel' })
      if (error) return erroForm('esqueci', /rate limit|security purposes/i.test(error.message) ? 'Pedido repetido muito rápido. Espere um minuto e tente de novo.' : traduzErro(error))
      const ok = $('#esqueci-ok')
      ok.textContent = 'Pronto. Se esse e-mail tiver acesso ao painel, o link chega em alguns minutos. Confira também a caixa de spam.'
      ok.hidden = false
    })
  })

  $('#form-nova').addEventListener('submit', async ev => {
    ev.preventDefault()
    const s1 = $('#nova-senha').value, s2 = $('#nova-senha2').value
    if (s1.length < 8) return erroForm('nova', 'A senha precisa ter pelo menos 8 caracteres.')
    if (s1 !== s2) return erroForm('nova', 'As duas senhas não são iguais.')
    erroForm('nova', '')
    await ocupado(ev.submitter || $('#form-nova button[type=submit]'), async () => {
      const { error } = await app.sb.auth.updateUser({ password: s1 })
      if (error) return erroForm('nova', /different from the old/i.test(error.message) ? 'A nova senha precisa ser diferente da antiga.' : traduzErro(error))
      history.replaceState(null, '', location.pathname)
      aviso('Senha nova salva.')
      await entrarNoPainel()
    })
  })
}

/* ================================================================= painel */
let montado = false

async function entrarNoPainel() {
  const { data, error } = await app.sb.from('admins').select('user_id').limit(1)
  if (error || !data?.length) {
    await app.sb.auth.signOut()
    mostrarEntrada('entrar')
    erroForm('entrar', 'Sem permissão. Esse login não tem acesso ao painel.')
    return
  }
  try { await carregarConteudo() } catch (e) { aviso(traduzErro(e), 'erro') }
  $('#carregando').hidden = true
  $('#entrada').hidden = true
  $('#casca').hidden = false
  if (!montado) montarCasca()
  montado = true
  if (!location.hash || /access_token|type=/.test(location.hash)) history.replaceState(null, '', location.pathname + '#inicio')
  rotaAtual = null
  abrirRota()
  atualizarPublicar()
}

function montarCasca() {
  const item = (s, curto) => `<a class="menu__item" href="#${s.rota}" data-rota="${s.rota}">${icone(s.icone)}<span>${esc(curto ? (s.curto || s.nome) : s.nome)}</span></a>`
  $('#menu').innerHTML = SECOES.map(s => item(s)).join('')
  $('#barra').innerHTML = SECOES.filter(s => NA_BARRA.includes(s.rota)).map(s => item(s, true)).join('')
    + `<button class="menu__item" type="button" data-mais aria-haspopup="dialog">${icone('dots-three')}<span>Mais</span></button>`
  $('#folha-lista').innerHTML = SECOES.filter(s => !NA_BARRA.includes(s.rota)).map(s => item(s)).join('')
    + `<a class="menu__item" href="/" target="_blank" rel="noopener">${icone('arrow-square-out')}<span>Ver o site</span></a>`
    + `<button class="menu__item menu__item--sair" type="button" data-sair>${icone('sign-out')}<span>Sair</span></button>`
  $('.lateral [data-sair]').innerHTML = `${icone('sign-out')}<span>Sair</span>`

  const folha = $('#folha-mais')
  $('[data-mais]').addEventListener('click', () => folha.showModal())
  $('[data-fechar-folha]').innerHTML = icone('x')
  $('[data-fechar-folha]').addEventListener('click', () => folha.close())
  folha.addEventListener('click', ev => { if (ev.target === folha || ev.target.closest('a')) folha.close() })

  for (const b of $$('[data-sair]')) b.addEventListener('click', sair)
  for (const b of $$('[data-publicar]')) b.addEventListener('click', () => ocupado(b, publicarComAviso))

  window.addEventListener('hashchange', aoMudarHash)
  window.addEventListener('beforeunload', ev => { if (app.sujo) { ev.preventDefault(); ev.returnValue = '' } })
  document.addEventListener('pendente', atualizarPublicar)
  document.addEventListener('publicou', atualizarPublicar)
}

async function sair() {
  if (app.sujo && !(await confirmar({ titulo: 'Sair sem salvar?', texto: 'Você tem alterações que ainda não foram salvas nesta tela.', sim: 'Sair mesmo assim', nao: 'Continuar aqui' }))) return
  $('#folha-mais').open && $('#folha-mais').close()
  marcarSujo(false)
  await app.sb.auth.signOut()
  history.replaceState(null, '', location.pathname)
}

/* ---------------------------------------------------------------- rotas */
let rotaAtual = null
let hashAnterior = '#inicio'

async function aoMudarHash() {
  if (/access_token|type=/.test(location.hash)) return
  if (app.sujo) {
    const destino = location.hash
    history.replaceState(null, '', hashAnterior) // volta sem disparar outro hashchange
    const ok = await confirmar({ titulo: 'Sair sem salvar?', texto: 'Você tem alterações que ainda não foram salvas. Se sair agora, elas se perdem.', sim: 'Sair sem salvar', nao: 'Continuar editando', perigo: true })
    if (!ok) return
    marcarSujo(false)
    location.hash = destino
    return
  }
  abrirRota()
}

export function irPara(rota) { location.hash = '#' + rota }

// troca o endereço sem abrir a tela de novo (post novo que ganhou id depois de salvo)
export function trocarRota(rota) {
  rotaAtual = rota
  hashAnterior = '#' + rota
  history.replaceState(null, '', '#' + rota)
}

function abrirRota() {
  const h = location.hash.replace(/^#\/?/, '') || 'inicio'
  if (h === rotaAtual) return
  rotaAtual = h
  hashAnterior = '#' + h
  marcarSujo(false)
  const [base, param] = h.split('/')
  const secao = SECOES.find(s => s.rota === base) || SECOES[0]
  for (const a of $$('[data-rota]')) {
    const ativo = a.dataset.rota === secao.rota
    a.classList.toggle('menu__item--ativo', ativo)
    ativo ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')
  }
  $('[data-mais]')?.classList.toggle('menu__item--ativo', !NA_BARRA.includes(secao.rota))
  // cada tela ganha um contêiner novo, pra os ouvintes de evento da tela anterior irem embora junto
  const tela = document.createElement('div')
  tela.className = 'vista'
  $('#tela').replaceChildren(tela)
  window.scrollTo(0, 0)
  const fn = base === 'blog' && param ? () => telaPost(tela, param) : () => secao.tela(tela)
  document.title = `${secao.nome} · Painel Henry Seguros`
  Promise.resolve(fn()).catch(e => {
    console.error(e)
    tela.innerHTML = `<div class="cartao vazio">${icone('warning')}<p>${esc(traduzErro(e))}</p><button class="btn btn--primario" type="button" onclick="location.reload()">Recarregar</button></div>`
  })
}

/* ---------------------------------------------------------------- publicar */
let ultima = null

async function atualizarPublicar() {
  const pend = temPendente()
  for (const p of $$('[data-pendente]')) p.hidden = !pend
  for (const b of $$('[data-publicar]')) {
    b.innerHTML = `${icone('cloud-arrow-up')}<span>${b.hasAttribute('data-curto') ? 'Publicar' : 'Publicar alterações'}</span>${pend && b.hasAttribute('data-curto') ? '<span class="ponto-pendente" aria-label="há alterações não publicadas"></span>' : ''}`
  }
  try { ultima = await ultimaPublicacao() } catch { ultima = null }
  const txt = textoUltima()
  for (const u of $$('[data-ultima]')) u.textContent = txt
}

function textoUltima() {
  if (!ultima) return 'Nenhuma publicação ainda.'
  return ultima.ok ? `Última publicação: ${quando(ultima.pedido_em)}` : `Última tentativa falhou: ${quando(ultima.pedido_em)}`
}

export async function publicarComAviso() {
  const r = await publicarSite()
  aviso(r.mensagem || (r.ok ? 'Publicação iniciada.' : 'Não consegui publicar.'), r.ok ? 'ok' : 'erro')
  await atualizarPublicar()
  return r
}

/* ================================================================= tela Início */
async function telaInicio(tela) {
  const { data: { user } } = await app.sb.auth.getUser()
  const { data: posts } = await app.sb.from('posts').select('status')
  const pub = (posts || []).filter(p => p.status === 'publicado').length
  const ras = (posts || []).length - pub
  const nome = (user?.user_metadata?.nome || '').split(' ')[0]

  tela.innerHTML = `
    <header class="cab">
      <div>
        <p class="cab__rotulo">Painel do site</p>
        <h1 class="cab__titulo">${nome ? `Olá, ${esc(nome)}` : 'Olá'}</h1>
        <p class="cab__texto">Por aqui você escreve no blog e troca textos, fotos, depoimentos, perguntas e contato do site da Henry.</p>
      </div>
    </header>

    <section class="cartao publicar" aria-labelledby="pub-titulo">
      <div class="publicar__texto">
        <h2 id="pub-titulo" class="cartao__titulo">Levar as alterações para o site</h2>
        <p>O que você salva no painel fica guardado, mas só aparece no site depois que você clica em <strong>Publicar</strong>. O site leva cerca de 2 minutos para atualizar.</p>
        <p class="pendente pendente--grande" data-pendente hidden><span class="pendente__ponto" aria-hidden="true"></span>Há alterações não publicadas</p>
      </div>
      <div class="publicar__acao">
        <button class="btn btn--verde btn--grande" type="button" id="publicar-grande">${icone('cloud-arrow-up')}<span>Publicar alterações no site</span></button>
        <p class="publicar__ultima" data-ultima>${esc(textoUltima())}</p>
      </div>
    </section>

    <section class="numeros" aria-label="Resumo do blog">
      <a class="cartao numero" href="#blog"><strong>${pub}</strong><span>${pub === 1 ? 'post publicado' : 'posts publicados'}</span></a>
      <a class="cartao numero" href="#blog"><strong>${ras}</strong><span>${ras === 1 ? 'rascunho' : 'rascunhos'}</span></a>
      <a class="cartao numero numero--link" href="/" target="_blank" rel="noopener">${icone('arrow-square-out')}<span>Ver o site</span></a>
    </section>

    <section class="atalhos" aria-labelledby="atalhos-titulo">
      <h2 id="atalhos-titulo" class="secao-titulo">O que você quer fazer?</h2>
      <div class="atalhos__grade">
        <a class="cartao atalho" href="#blog/novo">${icone('plus')}<span><strong>Escrever um post</strong><small>Novo texto no blog</small></span></a>
        <a class="cartao atalho" href="#textos">${icone('text-aa')}<span><strong>Mudar um texto</strong><small>Títulos e frases do site</small></span></a>
        <a class="cartao atalho" href="#imagens">${icone('image')}<span><strong>Trocar uma foto</strong><small>Fotos das páginas</small></span></a>
        <a class="cartao atalho" href="#depoimentos">${icone('quotes')}<span><strong>Depoimentos</strong><small>O que os parceiros dizem</small></span></a>
      </div>
    </section>`
  const b = $('#publicar-grande', tela)
  b.addEventListener('click', () => ocupado(b, publicarComAviso))
  atualizarPublicar()
}
