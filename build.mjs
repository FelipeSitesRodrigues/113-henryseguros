/**
 * Build do site da Henry Seguros. HTML, CSS e JS estático em dist/ (motor do 080).
 * Páginas: Início, Sobre, Privacidade e uma página por seguro (7), que saem de
 * src/dados/solucoes.json com as seções sol-* (página-modelo aprovada: Seguro Auto).
 *
 *   node build.mjs                          todas as páginas em dist/
 *   node build.mjs --preview 03-solucoes    só aquela seção, em dist/preview/03-solucoes.html
 *   node build.mjs --publicar               tudo do zero, sem os previews (antes de subir)
 *
 * Como funciona:
 * - src/paginas.json lista as páginas fixas; as de seguro entram no fim, uma por item do
 *   solucoes.json. A Vercel serve seguro-auto.html em /seguro-auto (cleanUrls).
 * - src/molde.html é o esqueleto comum. <!-- @parcial NOME --> puxa src/partials/NOME.html
 *   (aninhado e com parâmetros: <!-- @parcial x-cta titulo="..." -->, {{p.titulo}}).
 *   {{pag.campo}} campo da página; {{s.campo}} campo do seguro (só nas páginas de seguro);
 *   {{wa:chave}} link do WhatsApp com a mensagem do config; {{wa-s}} o do seguro da página;
 *   {{cfg.caminho}} valor do config; {{cel.campo}} posição da tela do celular; {{ano}}.
 * - CSS e JS: os _* (base), os do nome de cada parcial usado e os pedidos com
 *   <!-- @usa nome -->, e 99-* por último. Cada página leva só o que usa, embutido.
 * - Geradores: <!-- @solucoes --> (cartões da Home), <!-- @solucoes-rodape -->,
 *   <!-- @seguradoras --> (faixa de logos), <!-- @faq --> (faq.json) e <!-- @faq-sol --> (as
 *   perguntas do seguro), <!-- @sol-paraquem -->, <!-- @sol-cobre -->, <!-- @sol-porque -->,
 *   <!-- @sol-outros -->.
 * - Títulos com data-palavras saem quebrados em letras (scripts/letras.mjs, kit /animacoes-site).
 * - <i data-i="nome" data-w="light"></i> vira <svg><use> do sprite (Phosphor) da página.
 * - <img data-img="nome" sizes="..." alt="..."> vira <picture> AVIF e WebP com width e height
 *   (src/assets/img/manifesto.json). data-preload: LCP, o pedido sai no topo do <head>.
 *   data-desk="nome": outra imagem a partir de 64em. data-img-max limita o src de reserva.
 * - Avisa: travessão, img sem alt/width/height, id repetido, âncora e link sem destino,
 *   marcador que sobrou, CSS com chave desbalanceada, mais de um h1 e as pendências do config.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync, copyFileSync, renameSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cheerio from 'cheerio'
import { letras } from './scripts/letras.mjs'

const RAIZ = path.dirname(fileURLToPath(import.meta.url))
const P = (...a) => path.join(RAIZ, ...a)
const DIST = P('dist')
const cfg = JSON.parse(readFileSync(P('site.config.json'), 'utf8'))
const ler = (arq) => JSON.parse(readFileSync(arq, 'utf8')).itens
const solucoes = ler(P('src/dados/solucoes.json'))
const faqGeral = ler(P('src/dados/faq.json'))
const cel = JSON.parse(readFileSync(P('src/dados/celular.json'), 'utf8'))
const manifesto = existsSync(P('src/assets/img/manifesto.json')) ? JSON.parse(readFileSync(P('src/assets/img/manifesto.json'), 'utf8')) : {}
const avisos = []
const BASE = (cfg.dominio || '').replace(/\/$/, '')

// páginas: as fixas e uma por seguro
const SECOES_SEGURO = ['sol-topo', 'sol-entenda', 'sol-paraquem', 'sol-cobre', 'sol-passos', 'sol-porque', 'sol-faq', 'sol-fim']
const paginas = [
  ...ler(P('src/paginas.json')),
  ...solucoes.map((s) => ({
    id: s.id,
    nome: s.nome,
    arquivo: `${s.rota.slice(1)}.html`,
    rota: s.rota,
    titulo: `${s.nome} em Alphaville | Henry Seguros`,
    descricao: `${s.nome} com as principais seguradoras e um consultor dedicado. ${s.descricao} Corretora em Alphaville, Barueri.`.slice(0, 158),
    ogTitulo: `${s.nome} | Henry Seguros`,
    ogDescricao: s.sub,
    ogAlt: s.alt,
    zap: 'consultor',
    tipoSchema: 'WebPage',
    seguro: { cobreTitulo: ['O que pode', 'estar coberto.'], ...s },
    // depoimentos das imobiliárias parceiras só onde o assunto é locação
    secoes: ['fianca', 'capitalizacao'].includes(s.id) ? SECOES_SEGURO.flatMap((n) => (n === 'sol-faq' ? ['03c-depoimentos', n] : [n])) : SECOES_SEGURO,
  })),
]

const argPreview = (() => {
  const i = process.argv.indexOf('--preview')
  return i > -1 ? process.argv[i + 1].split(',').map((s) => s.trim()) : null
})()

// ---------------------------------------------------------------- utilidades
function gravar(arq, conteudo) {
  mkdirSync(path.dirname(arq), { recursive: true })
  const tmp = `${arq}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`
  writeFileSync(tmp, conteudo)
  for (let t = 0; t < 20; t++) {
    try {
      renameSync(tmp, arq)
      return
    } catch (e) {
      if (t === 19) throw e
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50)
    }
  }
}

function copiarPasta(de, para) {
  if (!existsSync(de)) return
  mkdirSync(para, { recursive: true })
  for (const nome of readdirSync(de)) {
    if (nome.startsWith('.') || nome === 'manifesto.json') continue
    const a = path.join(de, nome)
    const b = path.join(para, nome)
    const st = statSync(a)
    if (st.isDirectory()) copiarPasta(a, b)
    else if (!existsSync(b) || statSync(b).size !== st.size || statSync(b).mtimeMs < st.mtimeMs) {
      try {
        copyFileSync(a, b)
      } catch {
        /* outro processo copiando o mesmo arquivo */
      }
    }
  }
}

function lerParcial(nome) {
  const arq = P('src/partials', `${nome}.html`)
  if (!existsSync(arq)) {
    avisos.push(`parcial ausente: ${nome}`)
    return `<!-- parcial ${nome} ainda não existe -->`
  }
  return readFileSync(arq, 'utf8')
}

function arquivos(pasta, ext, nomes) {
  if (!existsSync(P(pasta))) return []
  const todos = readdirSync(P(pasta)).filter((f) => f.endsWith(ext))
  const nome = (f) => f.slice(0, -ext.length)
  const base = todos.filter((f) => f.startsWith('_')).sort()
  const fim = todos.filter((f) => f.startsWith('99-')).sort()
  const meio = todos.filter((f) => !f.startsWith('_') && !f.startsWith('99-') && nomes.has(nome(f))).sort()
  return [...base, ...meio, ...fim]
}

function juntar(pasta, ext, nomes) {
  return arquivos(pasta, ext, nomes)
    .map((f) => {
      const c = readFileSync(P(pasta, f), 'utf8')
      if (ext === '.css') {
        const abre = (c.match(/{/g) || []).length
        const fecha = (c.match(/}/g) || []).length
        if (abre !== fecha) avisos.push(`CSS com chaves desbalanceadas: ${f} (${abre} abre, ${fecha} fecha)`)
      }
      return c
    })
    .join(ext === '.js' ? '\n;\n' : '\n')
}

// Todo px do CSS vira rem (16 px = 1rem; url() fica). Acima de 1920 a raiz cresce com a tela e
// a página escala junto (memória: cliente com zoom-out via o conteúdo espremido no meio).
// px que deve ficar real vai em maiúsculo (1PX).
const remCss = (css) =>
  css.replace(/url\([^)]*\)|(?<![\w.])(\d*\.?\d+)px\b/g, (m, n) => {
    if (n === undefined) return m
    const r = String(Number((Number(n) / 16).toFixed(4)))
    return `${r.startsWith('0.') ? r.slice(1) : r}rem`
  })

function minCss(css) {
  return remCss(css.replace(/\/\*[\s\S]*?\*\//g, ''))
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};])\s*/g, '$1')
    .replace(/,\s+/g, ',')
    .replace(/;}/g, '}')
    .replace(/(\d)PX\b/g, '$1px')
    .trim()
}

function minJs(js) {
  return js
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .map((l) => l.trim())
    .filter((l) => l !== '')
    .join('\n')
}

function valor(caminho, avisar = true) {
  const v = caminho.split('.').reduce((o, k) => (o == null ? undefined : o[k]), cfg)
  if (v === undefined && avisar) avisos.push(`config sem o caminho: ${caminho}`)
  return v ?? ''
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const wa = (msg) => `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`
function linkWa(chave) {
  const msg = cfg.mensagens[chave]
  if (!msg) avisos.push(`mensagem de WhatsApp sem chave no config: ${chave}`)
  return wa(msg || '')
}
// cada seguro com a sua mensagem (regra da casa)
const waServico = (s) => wa(cfg.mensagens.servico.replace('{servico}', s.mensagem))
const url = (rota) => `${BASE}${rota}`

// ---------------------------------------------------------------- ícones (sprite com <use>)
let usados = new Map()
function icone(nome, peso = 'light', classe = '') {
  const id = `i-${nome}-${peso}`
  if (!usados.has(id)) {
    const arq = P('node_modules/@phosphor-icons/core/assets', peso, `${nome}${peso === 'regular' ? '' : '-' + peso}.svg`)
    if (!existsSync(arq)) {
      avisos.push(`ícone não existe: ${nome} (${peso})`)
      return ''
    }
    const miolo = readFileSync(arq, 'utf8').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s+/g, ' ').trim()
    usados.set(id, `<symbol id="${id}" viewBox="0 0 256 256">${miolo}</symbol>`)
  }
  const cls = ['i', classe].filter(Boolean).join(' ')
  return `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`
}

// ---------------------------------------------------------------- imagens (<picture> AVIF e WebP)
function versoes(nome, ext) {
  return Object.entries(manifesto)
    .map(([arq, m]) => ({ arq, m, w: Number((arq.match(new RegExp(`^${nome}-(\\d+)\\.${ext}$`)) || [])[1]) }))
    .filter((v) => v.w)
    .sort((a, b) => a.w - b.w)
}
const srcset = (vs) => vs.map((v) => `/assets/img/${v.arq} ${v.m.w}w`).join(', ')
const attr = (s, nome) => (s.match(new RegExp(`\\s${nome}="([^"]*)"`)) || [])[1]
const semAttr = (s, ...nomes) => nomes.reduce((t, n) => t.replace(new RegExp(`\\s${n}="[^"]*"`, 'g'), ''), s)

function fontesDe(nome, sizes, media = '') {
  const va = versoes(nome, 'avif')
  const vw = versoes(nome, 'webp')
  if (!vw.length) avisos.push(`imagem sem arquivo no manifesto: ${nome}`)
  const maior = vw[vw.length - 1]?.m || { w: 1, h: 1 }
  const mq = media ? ` media="${media}"` : ''
  return [
    va.length ? `<source${mq} type="image/avif" srcset="${srcset(va)}" sizes="${sizes}" width="${maior.w}" height="${maior.h}">` : '',
    `<source${mq} type="image/webp" srcset="${srcset(vw)}" sizes="${sizes}" width="${maior.w}" height="${maior.h}">`,
  ].join('')
}

function imagens(html, preloads) {
  return html.replace(/<img\b([^>]*?)\sdata-img="([\w-]+)"([^>]*)>/g, (tag, antes, nome, depois) => {
    let attrs = antes + depois
    const sizes = attr(attrs, 'sizes') || '100vw'
    const desk = attr(attrs, 'data-desk')
    const deskSizes = attr(attrs, 'data-desk-sizes') || sizes
    const deskMedia = attr(attrs, 'data-desk-media') || '(min-width: 64em)'
    const max = Number(attr(attrs, 'data-img-max') || Infinity)
    const classePicture = attr(attrs, 'data-picture')
    const lcp = /\sdata-preload(?=[\s/]|$)/.test(attrs)
    attrs = semAttr(attrs, 'data-desk', 'data-desk-sizes', 'data-desk-media', 'data-img-max', 'data-picture', 'sizes').replace(/\sdata-preload(?=[\s/]|$)/, '')
    const fontes = desk ? [fontesDe(desk, deskSizes, deskMedia)] : []
    const vw = versoes(nome, 'webp')
    const va = versoes(nome, 'avif')
    if (!vw.length) {
      avisos.push(`data-img sem arquivo no manifesto: ${nome}`)
      return tag
    }
    if (lcp) preloads.push({ nome, sizes, desk, deskSizes, deskMedia })
    const principal = [...vw].reverse().find((v) => v.w <= max) || vw[0]
    if (va.length) fontes.push(`<source type="image/avif" srcset="${srcset(va)}" sizes="${sizes}">`)
    const img = `<img src="/assets/img/${principal.arq}" srcset="${srcset(vw)}" sizes="${sizes}" width="${principal.m.w}" height="${principal.m.h}"${attrs}>`
    return `<picture${classePicture ? ` class="${classePicture}"` : ''}>${fontes.join('')}${img}</picture>`
  })
}

function linksPreload(lista) {
  const inversa = (m) => {
    const x = /\(min-width:\s*([\d.]+)em\)/.exec(m)
    return x ? `(max-width: ${(Number(x[1]) - 0.01).toFixed(2)}em)` : ''
  }
  const link = (nome, sizes, media) => {
    const va = versoes(nome, 'avif')
    return va.length ? `<link rel="preload" as="image" type="image/avif" imagesrcset="${srcset(va)}" imagesizes="${sizes}"${media ? ` media="${media}"` : ''} fetchpriority="high">` : ''
  }
  return lista
    .flatMap((p) => (p.desk ? [link(p.nome, p.sizes, inversa(p.deskMedia)), link(p.desk, p.deskSizes, p.deskMedia)] : [link(p.nome, p.sizes, '')]))
    .filter(Boolean)
    .join('\n  ')
}

// ---------------------------------------------------------------- Home: cartões dos seguros
// Mockup aprovado (seção Soluções): cartão em retrato com a foto do seguro, o nome em dois
// tons no alto (pedido do Felipe: no lugar da frase de efeito), widgets de vidro, a linha do
// que cobre e o botão redondo. O cartão leva à página do seguro (link esticado no título); o
// WhatsApp do próprio seguro fica num botão separado, por cima (regra da casa).
const TAM_CARD = '(min-width: 80em) 300px, (min-width: 64em) 22vw, (min-width: 40em) 44vw, 78vw'
const cardSolucao = (s, i) => `
          <li class="card" data-revela="grade" style="--i:${(i + 1) % 4}">
            <img class="card__foto" data-img="card-${s.id}" data-img-max="540" sizes="${TAM_CARD}" alt="" loading="lazy" decoding="async">
            <h3 class="card__titulo"><a class="card__link" href="${s.rota}"><span class="card__l1">${esc(s.l1)}</span> <span class="card__l2">${esc(s.l2)}</span></a></h3>
            <ul class="card__widgets" role="list">${s.widgets.map(([ic, t]) => `<li class="vidro card__widget">${icone(ic, 'regular')}<span>${esc(t)}</span></li>`).join('')}</ul>
            <div class="card__base">
              <p class="card__desc">${esc(s.descricao)}</p>
              <a class="card__zap vidro" href="${esc(waServico(s))}" data-zap="card-${s.id}" data-servico="${esc(s.nome)}" aria-label="Cotar ${esc(s.nome)} pelo WhatsApp">${icone('whatsapp-logo', 'regular')}</a>
              <span class="card__seta vidro" aria-hidden="true">${icone('arrow-up-right', 'regular')}</span>
            </div>
          </li>`
const htmlSolucoes = () => solucoes.map(cardSolucao).join('')
// submenu "Soluções" do topo: as 7 páginas com ícone, nome e a linha do que cobre
const htmlSolucoesMenu = () =>
  solucoes
    .map((s) => `<li><a class="sub__item" href="${s.rota}" data-pag="${s.id}"><span class="sub__icone"><i data-i="${s.icone}" data-w="light"></i></span><span class="sub__txt"><span class="sub__nome">${esc(s.nome)}</span><span class="sub__desc">${esc(s.descricao)}</span></span></a></li>`)
    .join('\n                ')
const htmlSolucoesRodape = () => solucoes.map((s) => `<li><a href="${s.rota}">${esc(s.nome)}</a></li>`).join('\n              ')

// ---------------------------------------------------------------- faixa das seguradoras
// Os logos numa cor só (petróleo), correndo em loop. Duas cópias da lista; a segunda é só
// desenho. Carregam já (eager): na faixa que anda, o lazy chegava em branco (memória do 077).
const SEGURADORAS = [
  ['porto', 'Porto Seguro'],
  ['tokio', 'Tokio Marine'],
  ['bradesco', 'Bradesco Seguros'],
  ['allianz', 'Allianz'],
  ['hdi', 'HDI Seguros'],
  ['yelum', 'Yelum Seguradora'],
  ['sulamerica', 'SulAmérica'],
  ['zurich', 'Zurich'],
  ['suhai', 'Suhai Seguradora'],
]
const htmlSeguradoras = () =>
  [false, true]
    .map(
      (copia) =>
        `<ul class="segs__lista" role="list"${copia ? ' aria-hidden="true"' : ''}>${SEGURADORAS.map(
          ([id, nome]) => `<li class="segs__item"><img data-img="seg-${id}" sizes="120px" alt="${copia ? '' : esc(nome)}" decoding="async" class="segs__logo segs__logo--${id}"></li>`,
        ).join('')}</ul>`,
    )
    .join('')

// ---------------------------------------------------------------- páginas de seguro
const htmlParaQuem = (s) =>
  s.paraQuem.map(([ic, t, d], i) => `<li class="pq" data-revela="grade" style="--i:${i}">${icone(ic, 'light', 'pq__i')}<h3 class="pq__t">${esc(t)}</h3><p class="pq__d">${esc(d)}</p></li>`).join('')
const htmlCobre = (s) => s.cobre.map(([ic, t], i) => `<li class="cob vidro" data-revela="grade" style="--i:${i % 3}">${icone(ic, 'light', 'cob__i')}<span>${esc(t)}</span></li>`).join('')
// conteúdo extra (scripts/conteudo_seguros.py): o que é, o que pesa no preço, opcionais e passo a passo
const htmlEntenda = (s) => (s.entenda || []).map((t, i) => `<p class="entenda__p" data-revela style="--atraso:${(0.15 + i * 0.1).toFixed(2)}s">${esc(t)}</p>`).join('')
const htmlPreco = (s) =>
  (s.preco || []).map(([ic, t, d], i) => `<li class="preco__item" data-revela="grade" style="--i:${i % 2}">${icone(ic, 'light', 'preco__i')}<div><h4 class="preco__t">${esc(t)}</h4><p class="preco__d">${esc(d)}</p></div></li>`).join('')
const htmlExtras = (s) =>
  s.extras?.length
    ? `<div class="extras"><h3 class="extras__titulo" data-revela>Pra deixar sob medida</h3><ul class="extras__lista" role="list">${s.extras.map(([ic, t], i) => `<li class="extra" data-revela="grade" style="--i:${i % 3}">${icone(ic, 'light', 'extra__i')}<span>${esc(t)}</span></li>`).join('')}</ul><p class="extras__nota" data-revela>Coberturas e assistências opcionais. Disponibilidade e limites variam por seguradora.</p></div>`
    : ''
const htmlPassos = (s) =>
  (s.passos || []).map(([t, d], i) => `<li class="spasso" data-revela="grade" style="--i:${i}"><span class="spasso__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><h3 class="spasso__t">${esc(t)}</h3><p class="spasso__d">${esc(d)}</p></li>`).join('')
const htmlPorque = (s) => s.porque.map((t, i) => `<li class="pqh" data-revela="grade" style="--i:${i}"><span class="pqh__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><p class="pqh__t">${esc(t)}</p></li>`).join('')
const htmlOutros = (s) =>
  solucoes
    .filter((o) => o.id !== s.id)
    .map((o) => `<li><a class="vidro pilula" href="${o.rota}">${esc(o.curto)}</a></li>`)
    .join('')

// ---------------------------------------------------------------- dúvidas (acordeão)
function htmlFaq(itens) {
  return itens
    .map(
      (q, i) => `
            <div class="faq__item${i === 0 ? ' faq__item--aberto' : ''}" data-revela="grade" style="--i:${Math.min(i, 4)}">
              <h3 class="faq__pergunta">
                <button class="faq__botao" type="button" id="faq-b${i + 1}" aria-expanded="${i === 0}" aria-controls="faq-r${i + 1}"><span>${esc(q.pergunta)}</span><span class="faq__mais" aria-hidden="true"></span></button>
              </h3>
              <div class="faq__resposta" id="faq-r${i + 1}" role="region" aria-labelledby="faq-b${i + 1}">
                <div class="faq__miolo"><p>${esc(q.resposta)}</p></div>
              </div>
            </div>`,
    )
    .join('')
}

// ---------------------------------------------------------------- dados estruturados (GEO e Google)
function schema(pag, faqItens) {
  const id = (h) => `${BASE}/#${h}`
  const negocio = {
    '@type': ['InsuranceAgency', 'LocalBusiness'],
    '@id': id('negocio'),
    name: cfg.nome,
    legalName: cfg.razao,
    taxID: cfg.cnpj,
    description:
      'A Henry Seguros é uma corretora de seguros em Alphaville, Barueri (SP), que atende famílias e empresas com seguro auto, residencial, empresarial, frota, fiança, título de capitalização e responsabilidade civil. Trabalha com Porto Seguro, Tokio Marine, Bradesco Seguros, Allianz, HDI, Yelum, SulAmérica, Zurich e Suhai, e cada cliente tem um consultor dedicado, da cotação ao sinistro. Registro SUSEP 262178985.',
    slogan: 'Confiança em cada escolha, segurança em cada passo.',
    url: url('/'),
    image: url('/assets/img/og-henry.jpg'),
    logo: url('/icon-512.png'),
    telephone: cfg.telefone,
    email: cfg.email,
    foundingDate: '2022',
    founder: { '@id': id('paulo') },
    address: { '@type': 'PostalAddress', streetAddress: cfg.endereco, addressLocality: `${cfg.bairro}, ${cfg.cidade}`, addressRegion: cfg.uf, addressCountry: 'BR' },
    areaServed: [
      { '@type': 'City', name: 'Barueri' },
      { '@type': 'City', name: 'Santana de Parnaíba' },
      { '@type': 'City', name: 'São Paulo' },
    ],
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' }],
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', telephone: cfg.telefone, email: cfg.email, availableLanguage: 'Portuguese' },
    sameAs: [cfg.instagramUrl],
    makesOffer: solucoes.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.nome, description: s.sub, url: url(s.rota) } })),
  }
  const paulo = {
    '@type': 'Person',
    '@id': id('paulo'),
    name: cfg.dono,
    jobTitle: 'Fundador e consultor de seguros da Henry Seguros',
    worksFor: { '@id': id('negocio') },
    image: url('/assets/img/paulo-600.webp'),
    url: url('/sobre'),
  }
  const site = { '@type': 'WebSite', '@id': id('site'), name: cfg.nome, url: url('/'), inLanguage: 'pt-BR', publisher: { '@id': id('negocio') } }
  const endereco = url(pag.rota)
  const pagina = { '@type': pag.tipoSchema || 'WebPage', '@id': `${endereco}#pagina`, url: endereco, name: pag.titulo, description: pag.descricao, inLanguage: 'pt-BR', isPartOf: { '@id': id('site') }, about: { '@id': id('negocio') } }
  const grafo = [negocio, site, pagina]
  if (pag.rota !== '/') {
    const migalhas = { '@type': 'BreadcrumbList', '@id': `${endereco}#migalhas`, itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: url('/') }, { '@type': 'ListItem', position: 2, name: pag.nome, item: endereco }] }
    pagina.breadcrumb = { '@id': migalhas['@id'] }
    grafo.push(migalhas)
  }
  if (pag.seguro) grafo.push({ '@type': 'Service', '@id': `${endereco}#servico`, name: pag.seguro.nome, serviceType: pag.seguro.nome, description: pag.seguro.sub, provider: { '@id': id('negocio') }, areaServed: 'Alphaville, Barueri, SP' })
  if (pag.paulo) {
    grafo.push(paulo)
    if (pag.tipoSchema === 'AboutPage') pagina.mainEntity = { '@id': id('paulo') }
  }
  if (faqItens) grafo.push({ '@type': 'FAQPage', '@id': `${endereco}#duvidas`, mainEntity: faqItens.map((q) => ({ '@type': 'Question', name: q.pergunta, acceptedAnswer: { '@type': 'Answer', text: q.resposta } })) })
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo })}</script>`
}

// ---------------------------------------------------------------- montagem de uma página
function montar(pag, preview = null) {
  usados = new Map()
  let faqItens = null
  const preloads = []
  const nomes = new Set()
  const s = pag.seguro || solucoes[0]
  let html = readFileSync(P('src/molde.html'), 'utf8')
  const secoes = (preview || pag.secoes).filter((n) => n !== '00-header' && n !== '10-rodape')
  html = html.replace('<!-- @conteudo -->', secoes.map((n) => `    <!-- @parcial ${n} -->`).join('\n'))
  if (preview) {
    if (!preview.includes('00-header')) html = html.replace(/<!--\s*@parcial 00-header\s*-->/, '')
    if (!preview.includes('10-rodape')) html = html.replace(/<!--\s*@parcial 10-rodape\s*-->/, '')
  }
  for (let n = 0; n < 5 && /<!--\s*@parcial\s/.test(html); n++)
    html = html.replace(/<!--\s*@parcial\s+([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s*-->/g, (_, nome, params) => {
      nomes.add(nome)
      const ps = Object.fromEntries([...params.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]))
      const corpo = lerParcial(nome).replace(/<!--\s*@se-p\s+([\w-]+)\s*-->([\s\S]*?)<!--\s*\/@se-p\s*-->/g, (_, k, dentro) => (ps[k] ? dentro : ''))
      return corpo.replace(/\{\{p\.([\w-]+)\}\}/g, (_, k) => {
        if (!(k in ps)) avisos.push(`[${pag.id}] parcial ${nome} sem o parâmetro ${k}`)
        return ps[k] ?? ''
      })
    })
  html = html.replace(/[ \t]*<!--\s*@usa\s+([\w\s,-]+?)\s*-->\n?/g, (_, lista) => {
    for (const d of lista.split(/[\s,]+/).filter(Boolean)) {
      if (!existsSync(P('src/css', `${d}.css`)) && !existsSync(P('src/js', `${d}.js`))) avisos.push(`[${pag.id}] @usa ${d}: não existe css nem js com esse nome`)
      nomes.add(d)
    }
    return ''
  })
  html = html
    .replace('<!-- @solucoes -->', htmlSolucoes)
    .replace('<!-- @solucoes-rodape -->', htmlSolucoesRodape)
    .replace('<!-- @solucoes-menu -->', htmlSolucoesMenu)
    .replace('<!-- @seguradoras -->', htmlSeguradoras)
    .replace('<!-- @sol-paraquem -->', () => htmlParaQuem(s))
    .replace('<!-- @sol-cobre -->', () => htmlCobre(s))
    .replace('<!-- @sol-extras -->', () => htmlExtras(s))
    .replace('<!-- @sol-entenda -->', () => htmlEntenda(s))
    .replace('<!-- @sol-preco -->', () => htmlPreco(s))
    .replace('<!-- @sol-passos -->', () => htmlPassos(s))
    .replace('<!-- @sol-porque -->', () => htmlPorque(s))
    .replace('<!-- @sol-outros -->', () => htmlOutros(s))
    .replace('<!-- @faq-sol -->', () => {
      faqItens = s.perguntas.map(([pergunta, resposta]) => ({ pergunta, resposta }))
      return htmlFaq(faqItens)
    })
    .replace('<!-- @faq -->', () => {
      faqItens = faqGeral
      return htmlFaq(faqItens)
    })
  html = html.replace(/\{\{s\.([\w-]+)(?:\.(\d))?\}\}/g, (_, k, i) => {
    const v = i === undefined ? s[k] : s[k]?.[Number(i)]
    if (v === undefined) avisos.push(`[${pag.id}] seguro sem o campo ${k}${i ? '.' + i : ''}`)
    return esc(v ?? '')
  })
  html = html.replace(/\{\{wa-s\}\}/g, () => esc(waServico(s)))
  html = html.replace(/\{\{cel\.([\w-]+)\}\}/g, (_, k) => String(cel[k]))
  const cabeca = []
  html = html.replace(/<!--\s*@head\s*-->([\s\S]*?)<!--\s*\/@head\s*-->/g, (_, c) => {
    cabeca.push(c.trim())
    return ''
  })
  html = html.replace('<!-- @head-parciais -->', cabeca.join('\n  '))
  html = html.replace('<!-- @js -->', () => `<script>${minJs(juntar('src/js', '.js', nomes))}</script>`)
  html = html.replace('<!-- @css -->', () => `<style>${minCss(juntar('src/css', '.css', nomes))}</style>`)
  html = html.replace(/<i data-i="([\w-]+)"(?: data-w="(\w+)")?(?: class="([^"]*)")?><\/i>/g, (_, nome, peso, classe) => icone(nome, peso || 'light', classe || ''))
  html = html.replace(/\{\{pag\.([\w-]+)\}\}/g, (_, k) => {
    if (pag[k] === undefined) avisos.push(`[${pag.id}] página sem o campo ${k}`)
    return esc(pag[k] ?? '')
  })
  html = html.replace(/\{\{inicio\}\}/g, pag.rota === '/' ? '#inicio' : '/')
  html = html.replace(/\{\{wa:([\w-]+)\}\}/g, (_, chave) => esc(linkWa(chave)))
  html = html.replace(/\{\{cfg\.([\w.]+)\}\}/g, (_, c) => esc(valor(c)))
  html = html.replace(/\{\{ano\}\}/g, String(new Date().getFullYear()))
  html = html.replace(/<a ([^>]*?)\s*data-pag="([\w-]+)"/g, (_, a, id) => `<a ${a}${id === pag.id ? ' aria-current="page"' : ''}`)
  html = html.replace(/<a\b(?![^>]*\starget=)([^>]*\shref="https:\/\/wa\.me\/)/g, '<a target="_blank" rel="noopener"$1')
  html = html.replace('<!-- @schema -->', () => schema(pag, faqItens))
  html = imagens(html, preloads)
  html = letras(html)
  html = html.replace('<!-- @sprite -->', () => `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;overflow:hidden">${[...usados.values()].join('')}</svg>`)
  html = html.replace('<!-- @preload-hero -->', () => linksPreload(preloads))
  html = html.replace(
    '<!-- @meta-dominio -->',
    BASE
      ? `<link rel="canonical" href="${url(pag.rota)}">\n  <meta property="og:url" content="${url(pag.rota)}">\n  <meta property="og:image" content="${url('/assets/img/og-henry.jpg')}">`
      : '<meta property="og:image" content="/assets/img/og-henry.jpg">',
  )
  return html
}

// ---------------------------------------------------------------- conferência
const idsPorRota = new Map()
const linksPorPagina = []
function verificar(html, pag) {
  const rotulo = pag.id
  const $ = cheerio.load(html)
  const ids = {}
  $('[id]').each((_, el) => {
    const id = $(el).attr('id')
    ids[id] = (ids[id] || 0) + 1
  })
  idsPorRota.set(pag.rota, new Set(Object.keys(ids)))
  $('a[href^="/"]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href.startsWith('/assets/')) linksPorPagina.push({ de: rotulo, href })
  })
  $('script, style, template').remove()
  const texto = $('body').text()
  const tracos = texto.match(/.{0,30}[—–].{0,30}/g)
  if (tracos) avisos.push(`[${rotulo}] travessão no texto (regra da casa): ${tracos.slice(0, 4).map((s) => JSON.stringify(s.trim())).join(' | ')}`)
  const sobrou = html.match(/\{\{[^}]+\}\}/g)
  if (sobrou) avisos.push(`[${rotulo}] marcadores sem valor: ${[...new Set(sobrou)].join(', ')}`)
  $('img').each((_, el) => {
    const src = ($(el).attr('src') || '?').slice(0, 60)
    if ($(el).attr('alt') === undefined) avisos.push(`[${rotulo}] img sem alt: ${src}`)
    if (!$(el).attr('width') || !$(el).attr('height')) avisos.push(`[${rotulo}] img sem width/height (salto de layout): ${src}`)
  })
  for (const [id, n] of Object.entries(ids)) if (n > 1) avisos.push(`[${rotulo}] id repetido: #${id} (${n}x)`)
  if (!argPreview)
    $('a[href^="#"]').each((_, el) => {
      const alvo = $(el).attr('href').slice(1)
      if (alvo && !ids[alvo]) avisos.push(`[${rotulo}] âncora sem destino: #${alvo}`)
    })
  if (!argPreview && $('h1').length !== 1) avisos.push(`[${rotulo}] ${$('h1').length} h1 na página (precisa ser 1)`)
}
function verificarLinks() {
  for (const { de, href } of linksPorPagina) {
    const [rota, hash] = href.split('#')
    const ids = idsPorRota.get(rota)
    if (!ids) avisos.push(`[${de}] link pra página que não existe: ${href}`)
    else if (hash && !ids.has(hash)) avisos.push(`[${de}] link com âncora que não existe na página: ${href}`)
  }
}

// ---------------------------------------------------------------- execução
if (process.argv.includes('--publicar')) rmSync(DIST, { recursive: true, force: true })
copiarPasta(P('src/assets'), path.join(DIST, 'assets'))
copiarPasta(P('src/raiz'), DIST)

const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} KB`
if (!argPreview) {
  const hoje = new Date().toISOString().slice(0, 10)
  for (const pag of paginas) {
    const html = montar(pag)
    verificar(html, pag)
    gravar(path.join(DIST, pag.arquivo), html)
    console.log(`ok dist/${pag.arquivo.padEnd(30)} ${kb(html).padStart(9)} (${usados.size} ícones)`)
  }
  verificarLinks()
  gravar(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /preview/\n${BASE ? `Sitemap: ${BASE}/sitemap.xml\n` : ''}`)
  if (BASE) gravar(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paginas.map((p) => `  <url><loc>${url(p.rota)}</loc><lastmod>${hoje}</lastmod></url>`).join('\n')}\n</urlset>\n`)
  for (const p of cfg.pendencias || []) avisos.push(`pendente: ${p}`)
  if (process.argv.includes('--publicar')) rmSync(path.join(DIST, 'preview'), { recursive: true, force: true })
} else {
  const nome = argPreview.join('+')
  const pag = { id: 'preview', nome: 'Preview', rota: '/preview/', titulo: 'Preview', descricao: '', ogTitulo: 'Preview', ogDescricao: '', ogAlt: '', zap: 'consultor', secoes: [] }
  const html = montar(pag, argPreview)
  verificar(html, pag)
  gravar(path.join(DIST, `preview/${nome}.html`), html)
  console.log(`ok /preview/${nome}.html ${kb(html)}`)
}
// /abertura: a Home com a abertura tocando em todo F5 (sem a trava de uma vez por visita), pra
// mostrar ao cliente. Fora do sitemap, com noindex e canonical na Home.
{
  const home = readFileSync(path.join(DIST, 'index.html'), 'utf8')
  const trava = "&&!sessionStorage.getItem('henry-abriu')"
  if (!home.includes(trava)) avisos.push('/abertura: trava da abertura não encontrada no index.html')
  const ab = home.replace(trava, '').replace('<head>', '<head>\n  <meta name="robots" content="noindex">')
  gravar(path.join(DIST, 'abertura.html'), ab)
  console.log('ok dist/abertura.html (abertura em todo F5)')
}
if (avisos.length) console.log(`AVISOS:\n  ${[...new Set(avisos)].join('\n  ')}`)
