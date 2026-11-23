// Conteúdo do site: textos, imagens, depoimentos, perguntas frequentes e contato.
import { app, enviarImagem, marcarSujo, salvarConteudo, traduzErro } from './app.js'
import { $, $$, aviso, autoAltura, confirmar, esc, escolherArquivo, ocupado } from './util.js'
import { icone } from './icones.js'

const SALVO = 'Salvo. Clique em Publicar para levar ao site.'
const normal = v => String(v ?? '').replace(/\r\n?/g, '\n')
const clonar = v => JSON.parse(JSON.stringify(v ?? null))

function cabecalho(rotulo, titulo, texto) {
  return `<header class="cab"><div><p class="cab__rotulo">${esc(rotulo)}</p><h1 class="cab__titulo">${esc(titulo)}</h1>${texto ? `<p class="cab__texto">${texto}</p>` : ''}</div></header>`
}

function barraSalvar(rotulo) {
  return `<div class="barra-salvar"><p class="barra-salvar__estado" data-estado aria-live="polite"></p><button class="btn btn--primario" type="button" data-salvar>${icone('check-circle')}<span>${esc(rotulo)}</span></button></div>`
}

function estado(tela, txt) { const e = $('[data-estado]', tela); if (e) e.textContent = txt }

/* ================================================================= textos */
export function telaTextos(tela) {
  const campos = app.cfg.campos || []
  const atuais = { ...(app.conteudo.textos || {}) }
  const grupos = []
  for (const c of campos) {
    let g = grupos.find(x => x.nome === c.grupo)
    if (!g) grupos.push(g = { nome: c.grupo || 'Outros', campos: [] })
    g.campos.push(c)
  }
  const valor = c => c.chave in atuais ? normal(atuais[c.chave]) : normal(c.padrao)
  const qtdMod = g => g.campos.filter(c => c.chave in atuais && normal(atuais[c.chave]) !== normal(c.padrao)).length

  tela.innerHTML = cabecalho('Textos do site', 'Textos do site',
    'Mude títulos e frases das páginas. O que você mudar ganha a marca <strong>modificado</strong> e pode voltar ao original quando quiser.')
    + `<div class="grupos">${grupos.map((g, i) => `
      <details class="cartao sanfona" ${i === 0 ? 'open' : ''}>
        <summary><span>${icone('caret-down', 'sanfona__seta')}${esc(g.nome)}</span><small data-qtd>${qtdTexto(qtdMod(g), g.campos.length)}</small></summary>
        <div class="sanfona__corpo">${g.campos.map(c => `
          <div class="campo campo--texto" data-chave="${esc(c.chave)}">
            <div class="campo__linha">
              <label for="t-${esc(c.chave)}">${esc(c.rotulo)}</label>
              <span class="chip chip--aviso" data-mod hidden>modificado</span>
            </div>
            <textarea id="t-${esc(c.chave)}" rows="${c.tipo === 'texto' ? 3 : 1}" class="${c.tipo === 'linha' ? 'campo--linha' : ''}">${esc(valor(c))}</textarea>
            <div class="campo__rodape">
              ${c.tipo === 'linha' ? '<p class="campo__ajuda">Enter quebra a linha no site.</p>' : '<span></span>'}
              <button class="link link--pequeno" type="button" data-restaurar hidden>${icone('arrow-counter-clockwise')}<span>Restaurar original</span></button>
            </div>
          </div>`).join('')}
        </div>
      </details>`).join('')}</div>`
    + (campos.length ? barraSalvar('Salvar textos') : `<div class="cartao vazio"><p>Nenhum texto editável configurado.</p></div>`)

  const padraoDe = k => normal(campos.find(c => c.chave === k)?.padrao)
  const marca = bloco => {
    const t = $('textarea', bloco)
    const mod = normal(t.value) !== padraoDe(bloco.dataset.chave)
    $('[data-mod]', bloco).hidden = !mod
    $('[data-restaurar]', bloco).hidden = !mod
    bloco.classList.toggle('campo--mod', mod)
  }
  const contaGrupos = () => {
    for (const d of $$('details', tela)) {
      const blocos = $$('[data-chave]', d)
      $('[data-qtd]', d).textContent = qtdTexto(blocos.filter(b => b.classList.contains('campo--mod')).length, blocos.length)
    }
  }
  for (const bloco of $$('[data-chave]', tela)) {
    autoAltura($('textarea', bloco))
    marca(bloco)
  }
  // a altura automática precisa medir quando a sanfona abre
  for (const d of $$('details', tela)) d.addEventListener('toggle', () => $$('textarea', d).forEach(t => t.dispatchEvent(new Event('input'))))
  contaGrupos()

  tela.addEventListener('input', ev => {
    const bloco = ev.target.closest('[data-chave]')
    if (!bloco) return
    marca(bloco); contaGrupos(); marcarSujo(); estado(tela, 'Alterações não salvas')
  })
  tela.addEventListener('click', ev => {
    const r = ev.target.closest('[data-restaurar]')
    if (r) {
      const bloco = r.closest('[data-chave]')
      const t = $('textarea', bloco)
      t.value = padraoDe(bloco.dataset.chave)
      t.dispatchEvent(new Event('input', { bubbles: true }))
      t.focus()
      return
    }
    const s = ev.target.closest('[data-salvar]')
    if (s) ocupado(s, async () => {
      const novo = { ...atuais }
      for (const bloco of $$('[data-chave]', tela)) {
        const k = bloco.dataset.chave
        const v = normal($('textarea', bloco).value)
        // vazio volta ao original: texto em branco no site quase sempre é engano
        if (!v.trim() || v === padraoDe(k)) delete novo[k]
        else novo[k] = v
      }
      try {
        await salvarConteudo('textos', novo)
        Object.keys(atuais).forEach(k => delete atuais[k]); Object.assign(atuais, novo)
        for (const bloco of $$('[data-chave]', tela)) {
          const t = $('textarea', bloco)
          if (!t.value.trim()) { t.value = padraoDe(bloco.dataset.chave); marca(bloco) }
        }
        contaGrupos()
        marcarSujo(false); estado(tela, 'Tudo salvo'); aviso(SALVO)
      } catch (e) { aviso(traduzErro(e), 'erro') }
    })
  })
}
const qtdTexto = (mod, total) => mod ? `${mod} ${mod === 1 ? 'modificado' : 'modificados'} de ${total}` : `${total} ${total === 1 ? 'texto' : 'textos'}`

/* ================================================================= imagens */
export function telaImagens(tela) {
  const imagens = app.cfg.imagens || []
  tela.innerHTML = cabecalho('Imagens', 'Fotos do site',
    'Troque as fotos das páginas. A foto nova é reduzida e otimizada aqui mesmo antes de subir, então pode mandar a foto grande do celular ou da câmera.')
    + `<ul class="imagens" role="list">${imagens.map(im => `<li class="cartao imagem" data-nome="${esc(im.nome)}"></li>`).join('')}</ul>`

  const desenha = li => {
    const im = imagens.find(x => x.nome === li.dataset.nome)
    const troca = app.conteudo.imagens?.[im.nome]?.url
    const deitada = im.largura >= im.altura
    li.innerHTML = `
      <div class="imagem__quadro" style="aspect-ratio:${im.largura} / ${im.altura}">
        <img src="${esc(troca || im.padrao)}" alt="${esc(im.rotulo)}" loading="lazy">
        ${troca ? '<span class="chip chip--aviso imagem__chip">modificada</span>' : ''}
      </div>
      <div class="imagem__info">
        <h2 class="cartao__titulo">${esc(im.rotulo)}</h2>
        <p class="imagem__grupo">${esc(im.grupo || '')}</p>
        <p class="imagem__tam">Tamanho ideal: ${im.largura} x ${im.altura} px, foto ${deitada ? 'deitada' : 'em pé'}</p>
        <div class="imagem__botoes">
          <button class="btn btn--primario btn--pequeno" type="button" data-trocar>${icone('upload-simple')}<span>Trocar foto</span></button>
          ${troca ? `<button class="btn btn--leve btn--pequeno" type="button" data-restaurar>${icone('arrow-counter-clockwise')}<span>Restaurar original</span></button>` : ''}
        </div>
      </div>`
  }
  $$('[data-nome]', tela).forEach(desenha)
  if (!imagens.length) tela.insertAdjacentHTML('beforeend', '<div class="cartao vazio"><p>Nenhuma imagem editável configurada.</p></div>')

  tela.addEventListener('click', async ev => {
    const li = ev.target.closest('[data-nome]')
    if (!li) return
    const im = imagens.find(x => x.nome === li.dataset.nome)
    const atual = clonar(app.conteudo.imagens || {}) || {}

    const r = ev.target.closest('[data-restaurar]')
    if (r) {
      if (!(await confirmar({ titulo: 'Voltar à foto original?', texto: `"${im.rotulo}" volta a ser a foto original do site.`, sim: 'Restaurar original' }))) return
      await ocupado(r, async () => {
        delete atual[im.nome]
        try { await salvarConteudo('imagens', atual); desenha(li); aviso(SALVO) } catch (e) { aviso(traduzErro(e), 'erro') }
      })
      return
    }
    const t = ev.target.closest('[data-trocar]')
    if (!t) return
    const arq = await escolherArquivo()
    if (!arq) return
    await ocupado(t, async () => {
      li.classList.add('imagem--enviando')
      try {
        const env = await enviarImagem(arq, 'site', im.nome)
        atual[im.nome] = { url: env.url }
        await salvarConteudo('imagens', atual)
        desenha(li)
        aviso(SALVO)
        const avisos = []
        if (env.larguraOriginal < im.largura * 0.75) avisos.push(`A foto tem ${env.larguraOriginal} px de largura, bem menos que os ${im.largura} px ideais. No computador ela pode aparecer sem nitidez.`)
        const prop = (env.largura / env.altura) / (im.largura / im.altura)
        if (prop < 0.8 || prop > 1.25) avisos.push('O formato da foto é diferente do original. O site pode cortar as bordas.')
        if (avisos.length) li.querySelector('.imagem__info').insertAdjacentHTML('beforeend', `<p class="alerta">${icone('warning')}<span>${avisos.map(esc).join(' ')}</span></p>`)
      } catch (e) {
        aviso(traduzErro(e), 'erro')
      } finally { li.classList.remove('imagem--enviando') }
    })
  })
}

/* ================================================================= listas: depoimentos e perguntas */
function editorLista(tela, op) {
  let itens = clonar(app.conteudo[op.chave] ?? app.cfg.padroes?.[op.chave] ?? []) || []
  tela.innerHTML = cabecalho(op.rotulo, op.titulo, op.texto)
    + `<ol class="itens" role="list" data-itens></ol>
       <div class="itens__rodape">
         <button class="btn btn--leve" type="button" data-adicionar>${icone('plus')}<span>${esc(op.adicionar)}</span></button>
         <button class="link link--pequeno" type="button" data-original>${icone('arrow-counter-clockwise')}<span>Restaurar lista original</span></button>
       </div>`
    + barraSalvar(op.salvar)

  const lerDom = () => {
    itens = $$('[data-item]', tela).map(li => Object.fromEntries(op.campos.map(c => [c.k, normal($(`[data-k="${c.k}"]`, li).value)])))
  }
  const desenha = (foco) => {
    const n = itens.length
    $('[data-itens]', tela).innerHTML = itens.map((it, i) => `
      <li class="cartao item${op.destaque && i === 0 ? ' item--destaque' : ''}" data-item>
        <div class="item__cab">
          <span class="item__num">${op.nomeItem} ${i + 1}</span>
          ${op.destaque && i === 0 ? `<span class="chip chip--verde">${icone('star')}Destaque</span>` : ''}
          <div class="item__ctl">
            <button class="btn-icone" type="button" data-mover="-1" ${i === 0 ? 'disabled' : ''} aria-label="Subir ${op.nomeItem.toLowerCase()} ${i + 1}">${icone('arrow-up')}</button>
            <button class="btn-icone" type="button" data-mover="1" ${i === n - 1 ? 'disabled' : ''} aria-label="Descer ${op.nomeItem.toLowerCase()} ${i + 1}">${icone('arrow-down')}</button>
            <button class="btn-icone btn-icone--perigo" type="button" data-remover aria-label="Remover ${op.nomeItem.toLowerCase()} ${i + 1}">${icone('trash')}</button>
          </div>
        </div>
        <div class="item__campos${op.colunas ? ' item__campos--colunas' : ''}">${op.campos.map(c => `
          <div class="campo${c.tipo === 'texto' ? ' campo--cheio' : ''}">
            <label for="${op.chave}-${i}-${c.k}">${esc(c.rotulo)}</label>
            ${c.tipo === 'texto'
              ? `<textarea id="${op.chave}-${i}-${c.k}" data-k="${c.k}" rows="3" maxlength="${c.max || 600}">${esc(it[c.k])}</textarea>`
              : `<input id="${op.chave}-${i}-${c.k}" data-k="${c.k}" type="text" maxlength="${c.max || 120}" value="${esc(it[c.k])}">`}
          </div>`).join('')}
        </div>
      </li>`).join('') || `<li class="cartao vazio"><p>Lista vazia. ${esc(op.vazio)}</p></li>`
    $$('textarea', tela).forEach(autoAltura)
    if (foco != null) $$('[data-item]', tela)[foco]?.querySelector('input, textarea')?.focus()
  }
  desenha()
  const mudou = () => { marcarSujo(); estado(tela, 'Alterações não salvas') }

  tela.addEventListener('input', ev => { if (ev.target.closest('[data-item]')) mudou() })
  tela.addEventListener('click', async ev => {
    const li = ev.target.closest('[data-item]')
    const idx = li ? $$('[data-item]', tela).indexOf(li) : -1
    const mover = ev.target.closest('[data-mover]')
    if (mover) {
      lerDom()
      const j = idx + Number(mover.dataset.mover)
      ;[itens[idx], itens[j]] = [itens[j], itens[idx]]
      desenha()
      $$('[data-item]', tela)[j]?.querySelector(`[data-mover="${mover.dataset.mover}"]:not(:disabled)`)?.focus()
        || $$('[data-item]', tela)[j]?.querySelector('[data-mover]:not(:disabled)')?.focus()
      return mudou()
    }
    if (ev.target.closest('[data-remover]')) {
      lerDom()
      const it = itens[idx]
      const temTexto = Object.values(it).some(v => v.trim())
      if (temTexto && !(await confirmar({ titulo: `Remover ${op.nomeItem.toLowerCase()}?`, texto: `"${op.resumo(it)}" sai da lista. Só vale no site depois de salvar e publicar.`, sim: 'Remover', perigo: true }))) return
      itens.splice(idx, 1)
      desenha()
      return mudou()
    }
    if (ev.target.closest('[data-adicionar]')) {
      lerDom()
      itens.push(Object.fromEntries(op.campos.map(c => [c.k, ''])))
      desenha(itens.length - 1)
      $$('[data-item]', tela).at(-1)?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
      return mudou()
    }
    if (ev.target.closest('[data-original]')) {
      if (!(await confirmar({ titulo: 'Voltar à lista original?', texto: 'A lista volta a ser a do site original. Só vale depois de salvar.', sim: 'Restaurar lista' }))) return
      itens = clonar(app.cfg.padroes?.[op.chave] || [])
      desenha()
      return mudou()
    }
    const s = ev.target.closest('[data-salvar]')
    if (s) ocupado(s, async () => {
      lerDom()
      const limpos = itens.map(it => Object.fromEntries(Object.entries(it).map(([k, v]) => [k, v.trim()]))).filter(it => Object.values(it).some(Boolean))
      const falta = limpos.findIndex(it => op.campos.some(c => c.obrigatorio && !it[c.k]))
      if (falta >= 0) {
        const c = op.campos.find(c => c.obrigatorio && !limpos[falta][c.k])
        aviso(`Preencha "${c.rotulo}" em ${op.nomeItem.toLowerCase()} ${falta + 1}.`, 'erro')
        return
      }
      if (!limpos.length && !(await confirmar({ titulo: 'Salvar a lista vazia?', texto: 'A seção fica sem nenhum item no site.', sim: 'Salvar vazia' }))) return
      try {
        await salvarConteudo(op.chave, limpos)
        itens = limpos
        desenha()
        marcarSujo(false); estado(tela, 'Tudo salvo'); aviso(SALVO)
      } catch (e) { aviso(traduzErro(e), 'erro') }
    })
  })
}

export function telaDepoimentos(tela) {
  editorLista(tela, {
    chave: 'depoimentos', rotulo: 'Depoimentos', titulo: 'Depoimentos',
    texto: 'O que as imobiliárias parceiras dizem da Henry. O primeiro da lista é o <strong>destaque</strong>, o cartão maior do site. Use as setas para mudar a ordem.',
    nomeItem: 'Depoimento', adicionar: 'Adicionar depoimento', salvar: 'Salvar depoimentos', vazio: 'Adicione o primeiro depoimento.',
    destaque: true, colunas: true,
    campos: [
      { k: 'nome', rotulo: 'Nome', obrigatorio: true, max: 80 },
      { k: 'empresa', rotulo: 'Imobiliária ou empresa', max: 80 },
      { k: 'texto', rotulo: 'Depoimento', tipo: 'texto', obrigatorio: true, max: 600 },
    ],
    resumo: it => it.nome || 'Sem nome',
  })
}

export function telaFaq(tela) {
  editorLista(tela, {
    chave: 'faq', rotulo: 'Perguntas frequentes', titulo: 'Perguntas frequentes',
    texto: 'As dúvidas que aparecem no fim da página inicial. Respostas curtas e diretas funcionam melhor, inclusive no Google.',
    nomeItem: 'Pergunta', adicionar: 'Adicionar pergunta', salvar: 'Salvar perguntas', vazio: 'Adicione a primeira pergunta.',
    campos: [
      { k: 'pergunta', rotulo: 'Pergunta', obrigatorio: true, max: 160 },
      { k: 'resposta', rotulo: 'Resposta', tipo: 'texto', obrigatorio: true, max: 800 },
    ],
    resumo: it => it.pergunta || 'Sem pergunta',
  })
}

/* ================================================================= contato */
const CONTATO = {
  whatsapp: { rotulo: 'WhatsApp (número)', ajuda: 'Só números, com 55 e o DDD. Ex.: 5511946662511. É o número que os botões do site abrem.', tipo: 'tel', inputmode: 'numeric' },
  whatsappExibir: { rotulo: 'WhatsApp como aparece no site', ajuda: 'Ex.: (11) 94666-2511' },
  telefone: { rotulo: 'Telefone', ajuda: 'Com +55 e DDD. Ex.: +55 11 94666-2511', tipo: 'tel' },
  email: { rotulo: 'E-mail', tipo: 'email', inputmode: 'email' },
  instagram: { rotulo: 'Instagram (nome do perfil)', ajuda: 'Sem o @. Ex.: henry.seguros' },
  instagramUrl: { rotulo: 'Link do Instagram', tipo: 'url', inputmode: 'url', ajuda: 'Ex.: https://www.instagram.com/henry.seguros/' },
  endereco: { rotulo: 'Endereço', ajuda: 'Rua, número e sala.' },
  bairro: { rotulo: 'Bairro' },
  cidade: { rotulo: 'Cidade' },
  uf: { rotulo: 'Estado (sigla)', ajuda: 'Duas letras. Ex.: SP', max: 2 },
  horario: { rotulo: 'Horário de atendimento', ajuda: 'Ex.: Seg a sex, das 9h às 18h' },
}
const GRUPOS_CONTATO = [
  ['WhatsApp e telefone', ['whatsapp', 'whatsappExibir', 'telefone']],
  ['E-mail e Instagram', ['email', 'instagram', 'instagramUrl']],
  ['Endereço e horário', ['endereco', 'bairro', 'cidade', 'uf', 'horario']],
]

function formatarZap(d) {
  const m = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(d)
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : ''
}

export function telaContato(tela) {
  const padrao = app.cfg.padroes?.contato || {}
  const dados = { ...padrao, ...(app.conteudo.contato || {}) }
  const chaves = Object.keys(dados)
  const usadas = GRUPOS_CONTATO.flatMap(g => g[1])
  const grupos = [...GRUPOS_CONTATO.map(([n, ks]) => [n, ks.filter(k => k in dados)]), ['Outros', chaves.filter(k => !usadas.includes(k))]].filter(g => g[1].length)

  tela.innerHTML = cabecalho('Contato', 'Contato',
    'Os dados que aparecem no rodapé, na página de contato e nos botões de WhatsApp de todo o site.')
    + `<form class="contato" novalidate>${grupos.map(([nome, ks]) => `
      <section class="cartao">
        <h2 class="cartao__titulo">${esc(nome)}</h2>
        <div class="contato__grade">${ks.map(k => {
          const c = CONTATO[k] || { rotulo: k }
          return `<div class="campo${k === 'endereco' || k === 'instagramUrl' ? ' campo--cheio' : ''}">
            <label for="c-${k}">${esc(c.rotulo)}</label>
            <input id="c-${k}" name="${k}" type="${c.tipo || 'text'}" ${c.inputmode ? `inputmode="${c.inputmode}"` : ''} ${c.max ? `maxlength="${c.max}"` : ''} value="${esc(dados[k])}" ${c.ajuda ? `aria-describedby="c-${k}-ajuda"` : ''}>
            ${c.ajuda ? `<p class="campo__ajuda" id="c-${k}-ajuda">${esc(c.ajuda)}</p>` : ''}
            <p class="campo__erro" id="c-${k}-erro" hidden></p>
          </div>`
        }).join('')}</div>
      </section>`).join('')}</form>` + barraSalvar('Salvar contato')

  const form = $('form', tela)
  form.addEventListener('submit', ev => ev.preventDefault())
  const zap = form.elements.whatsapp
  const exibir = form.elements.whatsappExibir
  zap?.addEventListener('input', () => {
    const antes = zap.value
    zap.value = antes.replace(/\D/g, '')
    if (exibir && (exibir.value === '' || exibir.dataset.auto === '1' || exibir.value === formatarZap(zap.dataset.ultimo || ''))) {
      const f = formatarZap(zap.value)
      if (f) { exibir.value = f; exibir.dataset.auto = '1' }
    }
    zap.dataset.ultimo = zap.value
  })
  if (zap) zap.dataset.ultimo = zap.value
  exibir?.addEventListener('input', () => { exibir.dataset.auto = '' })
  form.elements.uf?.addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })

  tela.addEventListener('input', ev => { if (ev.target.form === form) { marcarSujo(); estado(tela, 'Alterações não salvas'); erroCampo(ev.target.name, '') } })

  function erroCampo(k, msg) {
    const e = $(`#c-${k}-erro`, tela)
    if (!e) return
    e.textContent = msg; e.hidden = !msg
    form.elements[k]?.setAttribute('aria-invalid', msg ? 'true' : 'false')
  }

  $('[data-salvar]', tela).addEventListener('click', ev => ocupado(ev.currentTarget, async () => {
    const novo = {}
    for (const k of chaves) novo[k] = (form.elements[k]?.value ?? dados[k] ?? '').trim()
    const erros = []
    if ('whatsapp' in novo && !/^55\d{10,11}$/.test(novo.whatsapp)) erros.push(['whatsapp', 'Use só números: 55, o DDD e o número. Ex.: 5511946662511'])
    if (novo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novo.email)) erros.push(['email', 'Esse e-mail não parece certo.'])
    if (novo.instagramUrl && !/^https:\/\/\S+$/.test(novo.instagramUrl)) erros.push(['instagramUrl', 'O link precisa começar com https://'])
    if (novo.instagram) novo.instagram = novo.instagram.replace(/^@/, '')
    if ('uf' in novo && novo.uf && !/^[A-Z]{2}$/.test(novo.uf)) erros.push(['uf', 'Use as duas letras do estado.'])
    for (const k of ['whatsapp', 'whatsappExibir', 'telefone', 'email']) if (k in novo && !novo[k] && !erros.some(e => e[0] === k)) erros.push([k, 'Esse campo não pode ficar vazio.'])
    for (const k of chaves) erroCampo(k, '')
    if (erros.length) {
      erros.forEach(([k, m]) => erroCampo(k, m))
      form.elements[erros[0][0]]?.focus()
      aviso('Confira os campos marcados.', 'erro')
      return
    }
    try {
      await salvarConteudo('contato', novo)
      Object.assign(dados, novo)
      if (form.elements.instagram) form.elements.instagram.value = novo.instagram
      marcarSujo(false); estado(tela, 'Tudo salvo'); aviso(SALVO)
    } catch (e) { aviso(traduzErro(e), 'erro') }
  }))
}
