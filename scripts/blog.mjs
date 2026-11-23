/**
 * Blog: limpa o HTML que o editor do painel (Quill 2) grava e monta os pedaços das páginas.
 *
 * O texto vem do banco, então nada passa sem filtro: só as tags de texto da lista abaixo, link
 * só http(s), mailto, tel ou caminho do próprio site, imagem só do Storage do projeto. O Quill 2
 * grava toda lista como <ol> com <li data-list="bullet|ordered">; aqui vira <ul> ou <ol> de
 * verdade, que é o que o Google e o leitor de tela entendem.
 */
import * as cheerio from 'cheerio'

const PERMITIDAS = new Set(['p', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'br', 'img', 'hr', 'figure', 'figcaption'])
const TROCA = { b: 'strong', i: 'em', h1: 'h2', h5: 'h4', h6: 'h4', strike: 's', del: 's' }

export function limparPost(html, { ehDoStorage, titulo }) {
  const $ = cheerio.load(`<main>${html || ''}</main>`, null, false)
  $('.ql-ui, script, style, iframe, object, embed, form, input, button, svg, video, audio').remove()

  // listas do Quill 2: um <ol> com itens de tipos misturados vira blocos <ul>/<ol> seguidos
  $('ol, ul').each((_, el) => {
    const lis = $(el).children('li')
    if (!lis.filter('[data-list]').length) return
    const blocos = []
    lis.each((_, li) => {
      const tipo = $(li).attr('data-list') === 'ordered' ? 'ol' : 'ul'
      if (!blocos.length || blocos[blocos.length - 1].tipo !== tipo) blocos.push({ tipo, itens: [] })
      blocos[blocos.length - 1].itens.push($.html($(li).removeAttr('data-list')))
    })
    $(el).replaceWith(blocos.map((b) => `<${b.tipo}>${b.itens.join('')}</${b.tipo}>`).join(''))
  })

  // de baixo pra cima: troca, desembrulha ou limpa cada elemento
  const todos = $('main *').toArray().reverse()
  for (const el of todos) {
    let tag = el.tagName.toLowerCase()
    if (TROCA[tag]) {
      el.tagName = TROCA[tag]
      tag = TROCA[tag]
    }
    if (!PERMITIDAS.has(tag)) {
      $(el).replaceWith($(el).contents())
      continue
    }
    const attrs = { ...el.attribs }
    for (const a of Object.keys(attrs)) $(el).removeAttr(a)
    if (tag === 'a') {
      const href = (attrs.href || '').trim()
      if (/^(https?:|mailto:|tel:)/i.test(href) || /^\/(?!\/)/.test(href)) {
        $(el).attr('href', href)
        if (/^https?:/i.test(href)) $(el).attr({ target: '_blank', rel: 'noopener' })
      } else $(el).replaceWith($(el).contents())
    }
    if (tag === 'img') {
      if (!ehDoStorage(attrs.src)) $(el).remove()
      else $(el).attr({ src: attrs.src, alt: (attrs.alt || titulo || '').slice(0, 200) })
    }
  }
  // parágrafo vazio do editor (<p><br></p>) e espaço sobrando
  $('p').each((_, el) => {
    if (!$(el).text().trim() && !$(el).find('img').length) $(el).remove()
  })
  return $('main').html().trim()
}

export const textoPuro = (html) => cheerio.load(`<main>${html || ''}</main>`, null, false)('main').text().replace(/\s+/g, ' ').trim()

export function minutosDeLeitura(html) {
  const palavras = textoPuro(html).split(' ').filter(Boolean).length
  return Math.max(1, Math.round(palavras / 200))
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export function dataLonga(iso) {
  const d = new Date(iso)
  // dia no fuso de São Paulo (o build da Vercel roda em UTC)
  const [a, m, dia] = d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).split('-').map(Number)
  return `${dia} de ${MESES[m - 1]} de ${a}`
}
export const dataCurta = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
