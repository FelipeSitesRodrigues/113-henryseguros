/**
 * Versão em inglês (/en/...), pedido do Paulo em 2026-11-25, no molde do 0101 United Florida
 * (bandeiras redondas no topo). Aqui não tem chave por texto: a página sai montada em português
 * e cada "unidade de texto" é trocada pela tradução em src/i18n/en.json ({ "português": "inglês" }).
 *
 * Unidade de texto = o miolo (innerHTML) de um elemento que tem texto solto dentro. Assim
 * "Texto <strong>forte</strong> e mais" vira uma frase só pra traduzir, não três pedaços.
 * Também entram alt, aria-label, title, placeholder, as metas de descrição e compartilhamento,
 * o texto das mensagens de WhatsApp (?text=) e as strings do JSON-LD.
 *
 * Texto sem tradução fica em português e aparece no aviso do build. Texto que o Paulo muda no
 * painel muda a chave: até alguém traduzir, a versão em inglês mostra o texto dele em português.
 *
 * node build.mjs --extrair-en   grava em src/i18n/en.json as chaves novas (valor vazio)
 */
import * as cheerio from 'cheerio'

const PULA = new Set(['script', 'style', 'svg', 'noscript', 'code', 'pre'])
const ATRIBUTOS = ['alt', 'aria-label', 'title', 'placeholder']
const METAS = ['description', 'og:title', 'og:description', 'og:image:alt', 'twitter:title', 'twitter:description', 'twitter:image:alt']
const norm = (s) => s.replace(/\s+/g, ' ').trim()
const temLetra = (s) => /\p{L}/u.test(s)

// rota em português -> a mesma em inglês (/en, /en/seguro-auto, /en#solucoes)
export function rotaEn(href, rotasEn) {
  const m = href.match(/^(\/[^#?]*)?([?#].*)?$/)
  if (!m) return href
  const caminho = m[1] || '/'
  const resto = m[2] || ''
  if (!rotasEn.has(caminho)) return href
  return (caminho === '/' ? '/en' : `/en${caminho}`) + resto
}

/**
 * @param html página montada em português (antes das letras do título)
 * @param dic  { pt: en }
 * @param opc  { rotasEn: Set das rotas que têm versão em inglês, faltando: Set, coletar: bool }
 */
export function traduzir(html, dic, { rotasEn, faltando, coletar = false }) {
  const $ = cheerio.load(html, { decodeEntities: false })
  const tr = (txt) => {
    const k = norm(txt)
    if (!k || !temLetra(k)) return null
    if (coletar) {
      faltando.add(k)
      return null
    }
    const v = dic[k]
    if (typeof v === 'string' && v.trim()) return v
    faltando.add(k)
    return null
  }

  // textos
  const visitar = (el) => {
    for (const filho of $(el).contents().toArray()) {
      if (filho.type !== 'tag' && filho.type !== 'script' && filho.type !== 'style') continue
      if (PULA.has(filho.name)) continue
      // frase inteira com tradução própria (título em duas partes que muda a ordem em inglês)
      const todo = $(filho).html()
      const inteiro = coletar ? null : dic[norm(todo)]
      if (typeof inteiro === 'string' && inteiro.trim() && /</.test(todo)) {
        $(filho).html(inteiro)
        continue
      }
      const temTexto = $(filho).contents().toArray().some((n) => n.type === 'text' && temLetra(n.data))
      if (temTexto) {
        const bruto = $(filho).html()
        const v = tr(bruto)
        if (v !== null) {
          const ini = bruto.match(/^\s*/)[0]
          const fim = bruto.match(/\s*$/)[0]
          $(filho).html(ini + v + fim)
        }
      } else visitar(filho)
    }
  }
  // <template> (formulário que entra depois): vira <div> enquanto traduz, porque o parse5 guarda o
  // conteúdo fora da árvore e nem o texto nem os atributos dele seriam vistos
  const attrs = (el) => Object.entries(el.attribs).map(([k, v]) => (v === '' ? k : `${k}="${v.replace(/"/g, '&quot;')}"`)).join(' ')
  $('template').each((_, el) => {
    $(el).replaceWith(`<div data-era-template ${attrs(el)}>${$(el).html()}</div>`)
  })
  const t = $('title')
  if (t.length) {
    const v = tr(t.text())
    if (v !== null) t.text(v)
  }
  visitar($('body')[0])

  // atributos
  $('*').each((_, el) => {
    for (const a of ATRIBUTOS) {
      const val = $(el).attr(a)
      if (val === undefined) continue
      const v = tr(val)
      if (v !== null) $(el).attr(a, v)
    }
  })
  $('option[value]').each((_, el) => {
    const v = tr($(el).attr('value'))
    if (v !== null) $(el).attr('value', v)
  })
  for (const nome of METAS) {
    $(`meta[name="${nome}"], meta[property="${nome}"]`).each((_, el) => {
      const v = tr($(el).attr('content') || '')
      if (v !== null) $(el).attr('content', v)
    })
  }

  // links: rotas internas ganham /en; mensagens de WhatsApp em inglês
  $('a[href]:not([data-fixo]), link[rel="canonical"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href.startsWith('/')) {
      $(el).attr('href', rotaEn(href, rotasEn))
      return
    }
    const m = href.match(/^(https:\/\/wa\.me\/\d+\?text=)(.*)$/)
    if (m) {
      const msg = decodeURIComponent(m[2])
      const v = tr(msg)
      if (v !== null) $(el).attr('href', m[1] + encodeURIComponent(v))
    }
  })

  // JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    let dado
    try {
      dado = JSON.parse($(el).html())
    } catch {
      return
    }
    const andar = (x, chave) => {
      if (typeof x === 'string') {
        if (['@type', '@context', '@id', 'url', 'image', 'logo', 'telephone', 'email', 'sameAs', 'item', 'priceRange'].includes(chave)) return x
        if (/^https?:\/\//.test(x)) return x
        const v = tr(x)
        return v === null ? x : v
      }
      if (Array.isArray(x)) return x.map((y) => andar(y, chave))
      if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, y]) => [k, andar(y, k)]))
      return x
    }
    $(el).html(JSON.stringify(andar(dado, '')))
  })

  $('div[data-era-template]').each((_, el) => {
    $(el).removeAttr('data-era-template')
    $(el).replaceWith(`<template ${attrs(el)}>${$(el).html()}</template>`)
  })
  $('html').attr('lang', 'en')
  return $.html()
}
