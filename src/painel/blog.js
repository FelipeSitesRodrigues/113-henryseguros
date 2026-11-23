// Blog: lista de posts e editor.
import { app, caminhoDaUrl, enviarImagem, marcarPendente, marcarSujo, traduzErro } from './app.js'
import { $, aviso, autoAltura, confirmar, contador, dataCurta, deInputData, esc, escolherArquivo, ocupado, paraInputData, slugificar } from './util.js'
import { icone } from './icones.js'
import { publicarComAviso, trocarRota } from './painel.js'

const SLUG_OK = /^[a-z0-9]+(-[a-z0-9]+)*$/

const chip = status => status === 'publicado'
  ? '<span class="chip chip--verde">Publicado</span>'
  : '<span class="chip">Rascunho</span>'

/* ================================================================= lista */
export async function telaBlog(tela) {
  tela.innerHTML = `
    <header class="cab cab--acao">
      <div>
        <p class="cab__rotulo">Blog</p>
        <h1 class="cab__titulo">Posts do blog</h1>
        <p class="cab__texto">Rascunho fica só aqui no painel. Post publicado entra no site na próxima vez que você clicar em Publicar.</p>
      </div>
      <a class="btn btn--primario" href="#blog/novo">${icone('plus')}<span>Novo post</span></a>
    </header>
    <div id="lista-posts" class="lista-posts"><div class="cartao vazio"><span class="giro" aria-hidden="true"></span><p>Carregando os posts</p></div></div>`

  const { data, error } = await app.sb.from('posts')
    .select('id, titulo, slug, status, categoria, publicado_em, criado_em, atualizado_em')
    .order('criado_em', { ascending: false })
  if (error) throw error
  const caixa = $('#lista-posts', tela)
  if (!data.length) {
    caixa.innerHTML = `<div class="cartao vazio">${icone('newspaper')}<p><strong>Nenhum post ainda.</strong> Que tal escrever o primeiro? Posts ajudam a Henry a aparecer no Google.</p><a class="btn btn--primario" href="#blog/novo">${icone('plus')}<span>Escrever o primeiro post</span></a></div>`
    return
  }
  caixa.innerHTML = `<ul class="posts" role="list">${data.map(p => `
    <li class="cartao post" data-id="${p.id}">
      <a class="post__link" href="#blog/${p.id}">
        <span class="post__titulo">${esc(p.titulo)}</span>
        <span class="post__meta">${chip(p.status)}<span>${esc(p.categoria)}</span><span aria-hidden="true">·</span><span>${p.status === 'publicado' ? 'Publicado em ' + dataCurta(p.publicado_em) : 'Editado em ' + dataCurta(p.atualizado_em)}</span></span>
      </a>
      <div class="post__acoes">
        <a class="btn btn--leve btn--pequeno" href="#blog/${p.id}">${icone('pencil-simple')}<span>Editar</span></a>
        <button class="btn-icone btn-icone--perigo" type="button" data-apagar aria-label="Apagar o post ${esc(p.titulo)}">${icone('trash')}</button>
      </div>
    </li>`).join('')}</ul>`

  caixa.addEventListener('click', async ev => {
    const b = ev.target.closest('[data-apagar]')
    if (!b) return
    const li = b.closest('[data-id]')
    const post = data.find(p => p.id === li.dataset.id)
    const ok = await confirmar({ titulo: 'Apagar este post?', texto: `"${post.titulo}" vai sumir do painel${post.status === 'publicado' ? ' e, depois de Publicar, do site também' : ''}. Não dá para desfazer.`, sim: 'Apagar', perigo: true })
    if (!ok) return
    await ocupado(b, async () => {
      const r = await apagarPost(post.id)
      if (r) { aviso(traduzErro(r), 'erro'); return }
      li.remove()
      if (post.status === 'publicado') marcarPendente()
      aviso(post.status === 'publicado' ? 'Post apagado. Clique em Publicar para tirar do site.' : 'Post apagado.')
      if (!caixa.querySelector('[data-id]')) telaBlog(tela)
    })
  })
}

async function apagarPost(id) {
  const { data: post } = await app.sb.from('posts').select('capa_url, conteudo').eq('id', id).single()
  const { error } = await app.sb.from('posts').delete().eq('id', id)
  if (error) return error
  // limpa as imagens do post no Storage (melhor esforço: se falhar, o post já foi apagado)
  const urls = [post?.capa_url, ...[...(post?.conteudo || '').matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1])]
  const caminhos = urls.map(caminhoDaUrl).filter(c => c && c.startsWith('blog/'))
  if (caminhos.length) await app.sb.storage.from('midia').remove(caminhos).catch(() => {})
  return null
}

/* ================================================================= editor */
export async function telaPost(tela, id) {
  const novo = id === 'novo'
  let post = { titulo: '', slug: '', resumo: '', conteudo: '', capa_url: null, capa_alt: '', categoria: app.cfg.categorias?.[0] || 'Notícias', status: 'rascunho', publicado_em: null, seo_titulo: '', seo_descricao: '' }
  if (!novo) {
    const { data, error } = await app.sb.from('posts').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) {
      tela.innerHTML = `<div class="cartao vazio">${icone('warning')}<p>Esse post não existe mais.</p><a class="btn btn--primario" href="#blog">Voltar para o blog</a></div>`
      return
    }
    post = data
  }
  let slugManual = !novo && post.slug !== slugificar(post.titulo)
  const categorias = [...new Set([...(app.cfg.categorias || []), post.categoria].filter(Boolean))]
  const dominio = (app.cfg.site || location.origin).replace(/^https?:\/\//, '').replace(/\/$/, '')

  tela.innerHTML = `
    <a class="voltar" href="#blog">${icone('arrow-left')}<span>Posts do blog</span></a>
    <header class="cab">
      <div>
        <p class="cab__rotulo">${novo ? 'Novo post' : 'Editar post'} <span data-chip>${chip(post.status)}</span></p>
        <h1 class="cab__titulo" data-titulo-tela>${esc(post.titulo || 'Novo post')}</h1>
      </div>
    </header>

    <form class="editor" id="form-post" novalidate>
      <div class="editor__principal">
        <section class="cartao">
          <div class="campo">
            <label for="p-titulo">Título</label>
            <textarea id="p-titulo" class="campo--titulo" rows="1" maxlength="160" required placeholder="Ex.: Como escolher o seguro do seu carro">${esc(post.titulo)}</textarea>
          </div>
          <div class="campo">
            <label for="p-slug">Endereço do post</label>
            <div class="campo__prefixo"><span aria-hidden="true">/blog/</span><input id="p-slug" type="text" inputmode="url" autocapitalize="off" spellcheck="false" maxlength="90" value="${esc(post.slug)}" aria-describedby="p-slug-ajuda"></div>
            <p class="campo__ajuda" id="p-slug-ajuda">Sai sozinho do título. Só letras minúsculas, números e hífen. Evite mudar depois de publicado: o link antigo deixa de funcionar.</p>
          </div>
          <div class="campo">
            <label for="p-resumo">Resumo <span class="contador" id="p-resumo-n"></span></label>
            <textarea id="p-resumo" rows="3" maxlength="220" placeholder="Duas frases sobre o post. Aparece na lista do blog.">${esc(post.resumo)}</textarea>
          </div>
        </section>

        <section class="cartao cartao--editor">
          <p class="rotulo-campo" id="p-conteudo-rotulo">Conteúdo</p>
          <div id="p-conteudo" aria-labelledby="p-conteudo-rotulo"></div>
        </section>

        <details class="cartao sanfona" id="p-seo">
          <summary><span>${icone('caret-down', 'sanfona__seta')}Google (SEO)</span><small>Opcional. Como o post aparece na busca.</small></summary>
          <div class="sanfona__corpo">
            <div class="campo">
              <label for="p-seo-titulo">Título no Google <span class="contador" id="p-seo-titulo-n"></span></label>
              <input id="p-seo-titulo" type="text" maxlength="60" value="${esc(post.seo_titulo || '')}" placeholder="Se ficar vazio, usa o título do post">
            </div>
            <div class="campo">
              <label for="p-seo-desc">Descrição no Google <span class="contador" id="p-seo-desc-n"></span></label>
              <textarea id="p-seo-desc" rows="3" maxlength="155" placeholder="Se ficar vazia, usa o resumo">${esc(post.seo_descricao || '')}</textarea>
            </div>
            <div class="google" aria-label="Prévia no Google">
              <p class="google__rotulo">Prévia</p>
              <p class="google__url"><span class="google__ico" aria-hidden="true"><img src="/assets/abertura/simbolo.webp" alt=""></span><span><strong>Henry Seguros</strong><small data-g-url></small></span></p>
              <p class="google__titulo" data-g-titulo></p>
              <p class="google__desc" data-g-desc></p>
            </div>
          </div>
        </details>
      </div>

      <aside class="editor__lado">
        <section class="cartao">
          <div class="campo">
            <label for="p-categoria">Categoria</label>
            <select id="p-categoria">${categorias.map(c => `<option${c === post.categoria ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>
          </div>
          <div class="campo">
            <label for="p-data">Data de publicação</label>
            <input id="p-data" type="date" value="${paraInputData(post.publicado_em)}" aria-describedby="p-data-ajuda">
            <p class="campo__ajuda" id="p-data-ajuda">Se ficar vazia, entra a data do dia em que o post for publicado.</p>
          </div>
        </section>

        <section class="cartao">
          <p class="rotulo-campo">Foto de capa</p>
          <div class="capa" data-capa></div>
          <div class="campo">
            <label for="p-capa-alt">Descrição da foto</label>
            <input id="p-capa-alt" type="text" maxlength="200" value="${esc(post.capa_alt)}" placeholder="Ex.: Família sorrindo em frente à casa" aria-describedby="p-capa-alt-ajuda">
            <p class="campo__ajuda" id="p-capa-alt-ajuda">Para o Google e para quem usa leitor de tela.</p>
          </div>
        </section>
      </aside>

      <div class="editor__barra">
        <p class="editor__estado" data-estado aria-live="polite"></p>
        <div class="editor__botoes" data-botoes></div>
      </div>
    </form>`

  const f = {
    titulo: $('#p-titulo', tela), slug: $('#p-slug', tela), resumo: $('#p-resumo', tela),
    categoria: $('#p-categoria', tela), data: $('#p-data', tela), capaAlt: $('#p-capa-alt', tela),
    seoTitulo: $('#p-seo-titulo', tela), seoDesc: $('#p-seo-desc', tela),
  }
  autoAltura(f.titulo)
  autoAltura(f.resumo)
  contador(f.resumo, $('#p-resumo-n', tela), 220)
  contador(f.seoTitulo, $('#p-seo-titulo-n', tela), 60)
  contador(f.seoDesc, $('#p-seo-desc-n', tela), 155)
  if (post.seo_titulo || post.seo_descricao) $('#p-seo', tela).open = true

  /* -------- editor de texto (Quill) */
  const quill = await criarQuill($('#p-conteudo', tela))
  if (post.conteudo) quill.setContents(quill.clipboard.convert({ html: post.conteudo }), 'silent')
  quill.on('text-change', (_d, _o, fonte) => { if (fonte === 'user') sujou() })

  /* -------- capa */
  let capaUrl = post.capa_url
  const desenhaCapa = () => {
    const c = $('[data-capa]', tela)
    c.innerHTML = capaUrl
      ? `<img class="capa__img" src="${esc(capaUrl)}" alt="Capa atual"><div class="capa__botoes"><button class="btn btn--leve btn--pequeno" type="button" data-trocar-capa>${icone('upload-simple')}<span>Trocar</span></button><button class="btn btn--leve btn--pequeno" type="button" data-tirar-capa>${icone('trash')}<span>Tirar</span></button></div>`
      : `<button class="capa__vazia" type="button" data-trocar-capa>${icone('upload-simple')}<span><strong>Enviar foto de capa</strong><small>JPG, PNG ou WebP. Ideal: deitada, 1600 de largura.</small></span></button>`
  }
  desenhaCapa()
  $('[data-capa]', tela).addEventListener('click', async ev => {
    if (ev.target.closest('[data-tirar-capa]')) { capaUrl = null; desenhaCapa(); sujou(); return }
    const b = ev.target.closest('[data-trocar-capa]')
    if (!b) return
    const arq = await escolherArquivo()
    if (!arq) return
    await ocupado(b, async () => {
      try {
        const r = await enviarImagem(arq, 'blog')
        capaUrl = r.url
        desenhaCapa()
        sujou()
        if (r.larguraOriginal < 1000) aviso('A foto é pequena e pode ficar sem nitidez. O ideal é ter 1600 de largura ou mais.', 'erro')
        if (!f.capaAlt.value.trim()) f.capaAlt.focus()
      } catch (e) { aviso(traduzErro(e), 'erro') }
    })
  })

  /* -------- título gera o endereço, prévia do Google */
  const prevGoogle = () => {
    const slug = f.slug.value || 'endereco-do-post'
    $('[data-g-url]', tela).textContent = `${dominio} › blog › ${slug}`
    $('[data-g-titulo]', tela).textContent = (f.seoTitulo.value.trim() || f.titulo.value.trim() || 'Título do post') + ' | Henry Seguros'
    $('[data-g-desc]', tela).textContent = f.seoDesc.value.trim() || f.resumo.value.trim() || 'O resumo do post aparece aqui.'
  }
  f.titulo.addEventListener('input', () => {
    f.titulo.value = f.titulo.value.replace(/\n/g, ' ')
    if (!slugManual) f.slug.value = slugificar(f.titulo.value)
    $('[data-titulo-tela]', tela).textContent = f.titulo.value.trim() || 'Novo post'
  })
  f.slug.addEventListener('input', () => { slugManual = true })
  f.slug.addEventListener('blur', () => {
    f.slug.value = slugificar(f.slug.value)
    if (!f.slug.value) { slugManual = false; f.slug.value = slugificar(f.titulo.value) }
    prevGoogle()
  })
  const form = $('#form-post', tela)
  form.addEventListener('input', () => { sujou(); prevGoogle() })
  form.addEventListener('submit', ev => ev.preventDefault())
  prevGoogle()

  /* -------- estado e botões */
  function sujou() { marcarSujo(true); $('[data-estado]', tela).textContent = 'Alterações não salvas' }

  const desenhaBotoes = () => {
    $('[data-chip]', tela).innerHTML = chip(post.status)
    $('[data-botoes]', tela).innerHTML = post.status === 'publicado'
      ? `<button class="btn btn--leve" type="button" data-acao="rascunho">Voltar para rascunho</button>
         <button class="btn btn--primario" type="button" data-acao="publicado">${icone('check-circle')}<span>Salvar alterações</span></button>`
      : `<button class="btn btn--leve" type="button" data-acao="rascunho">Salvar rascunho</button>
         <button class="btn btn--verde" type="button" data-acao="publicado">${icone('check-circle')}<span>Publicar post</span></button>`
  }
  desenhaBotoes()

  $('[data-botoes]', tela).addEventListener('click', ev => {
    const b = ev.target.closest('[data-acao]')
    if (b) ocupado(b, () => salvar(b.dataset.acao))
  })

  async function salvar(status) {
    f.slug.value = slugificar(f.slug.value) || slugificar(f.titulo.value)
    const titulo = f.titulo.value.trim()
    const conteudo = htmlDoQuill(quill)
    const erro = titulo.length < 3 ? ['Escreva um título com pelo menos 3 letras.', f.titulo]
      : !SLUG_OK.test(f.slug.value) ? ['O endereço do post está vazio ou inválido.', f.slug]
      : status === 'publicado' && !conteudo ? ['Escreva o conteúdo do post antes de publicar.', quill.root]
      : null
    if (erro) { aviso(erro[0], 'erro'); erro[1].focus(); return }

    const dados = {
      titulo, slug: f.slug.value, resumo: f.resumo.value.trim(), conteudo,
      capa_url: capaUrl || null, capa_alt: f.capaAlt.value.trim(), categoria: f.categoria.value,
      status, publicado_em: deInputData(f.data.value),
      seo_titulo: f.seoTitulo.value.trim() || null, seo_descricao: f.seoDesc.value.trim() || null,
    }
    const estavaPublicado = post.status === 'publicado'
    const q = post.id ? app.sb.from('posts').update(dados).eq('id', post.id) : app.sb.from('posts').insert(dados)
    const { data, error } = await q.select().single()
    if (error) {
      aviso(traduzErro(error), 'erro')
      if (error.code === '23505') f.slug.focus()
      return
    }
    post = data
    f.data.value = paraInputData(post.publicado_em)
    if (novo || !location.hash.endsWith(post.id)) trocarRota('blog/' + post.id)
    marcarSujo(false)
    $('[data-estado]', tela).textContent = 'Tudo salvo'
    desenhaBotoes()
    const afetaSite = status === 'publicado' || estavaPublicado
    if (afetaSite) marcarPendente()

    if (status === 'publicado' && !estavaPublicado) {
      const agora = await confirmar({ titulo: 'Post publicado no painel', texto: 'Ele entra no site quando você clicar em Publicar. Quer publicar no site agora? Leva cerca de 2 minutos.', sim: 'Publicar no site agora', nao: 'Depois' })
      if (agora) await publicarComAviso()
      else aviso('Salvo. Clique em Publicar para levar ao site.')
    } else if (status === 'rascunho' && estavaPublicado) {
      const agora = await confirmar({ titulo: 'Post voltou para rascunho', texto: 'Ele sai do site quando você clicar em Publicar. Quer publicar agora?', sim: 'Publicar no site agora', nao: 'Depois' })
      if (agora) await publicarComAviso()
      else aviso('Salvo. Clique em Publicar para levar ao site.')
    } else {
      aviso(afetaSite ? 'Salvo. Clique em Publicar para levar ao site.' : 'Rascunho salvo.')
    }
  }
}

/* ---------------------------------------------------------------- Quill */
async function esperarQuill() {
  for (let i = 0; i < 100 && !window.Quill; i++) await new Promise(r => setTimeout(r, 50))
  if (!window.Quill) throw new Error('O editor de texto não carregou. Confira a internet e recarregue a página.')
  return window.Quill
}

async function criarQuill(el) {
  const Quill = await esperarQuill()
  const quill = new Quill(el, {
    theme: 'snow',
    placeholder: 'Escreva o post aqui. Use os botões H2 e H3 para os subtítulos.',
    formats: ['header', 'bold', 'italic', 'underline', 'link', 'list', 'blockquote', 'image'],
    modules: {
      toolbar: {
        container: [
          [{ header: 2 }, { header: 3 }],
          ['bold', 'italic', 'underline', 'link'],
          [{ list: 'bullet' }, { list: 'ordered' }],
          ['blockquote', 'image'],
          ['clean'],
        ],
        handlers: { image: () => imagemNoTexto(quill) },
      },
    },
  })
  // nomes dos botões em português (tooltip e leitor de tela)
  const nomes = {
    'ql-header[value="2"]': 'Subtítulo H2', 'ql-header[value="3"]': 'Subtítulo H3', 'ql-bold': 'Negrito', 'ql-italic': 'Itálico',
    'ql-underline': 'Sublinhado', 'ql-link': 'Link', 'ql-list[value="bullet"]': 'Lista com marcadores', 'ql-list[value="ordered"]': 'Lista numerada',
    'ql-blockquote': 'Citação', 'ql-image': 'Inserir imagem', 'ql-clean': 'Limpar formatação',
  }
  const barra = el.previousElementSibling
  for (const [sel, nome] of Object.entries(nomes)) {
    const b = barra.querySelector('button.' + sel)
    if (b) { b.setAttribute('aria-label', nome); b.title = nome }
  }
  quill.root.setAttribute('aria-label', 'Conteúdo do post')
  return quill
}

async function imagemNoTexto(quill) {
  const arq = await escolherArquivo()
  if (!arq) return
  const pos = (quill.getSelection(true) || { index: quill.getLength() }).index
  aviso('Enviando a imagem...')
  try {
    const r = await enviarImagem(arq, 'blog')
    quill.insertEmbed(pos, 'image', r.url, 'user')
    quill.setSelection(pos + 1, 0, 'silent')
  } catch (e) { aviso(traduzErro(e), 'erro') }
}

// HTML do editor, sem os enfeites internos do Quill; vazio quando não tem texto nem imagem
function htmlDoQuill(quill) {
  if (!quill.getText().trim() && !quill.root.querySelector('img')) return ''
  return quill.root.innerHTML.replace(/<span class="ql-ui"[^>]*><\/span>/g, '')
}
