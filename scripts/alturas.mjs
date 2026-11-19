/**
 * Mede a altura do CONTEÚDO (sem o padding) de cada seção com content-visibility, em 4
 * larguras, pra atualizar o contain-intrinsic-size do src/css/99-desempenho.css (memória do 076:
 * o navegador soma o padding por cima do número reservado).
 *
 * Uso: node scripts/alturas.mjs   (com o servidor no ar)
 */
import puppeteer from 'puppeteer-core'

const BASE = process.env.BASE_URL ?? 'http://localhost:3113'
const ROTAS = ['/', '/seguro-auto', '/sobre']
const LARGURAS = [1440, 1100, 800, 390]
const SEL = '.segs, .solucoes, .imob, .difs, .como, .sobre, .objs, .faq, .cta, .rodape, .pquem, .cobre, .porque, .sfim'

const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new' })
const p = await b.newPage()
const res = {}
for (const w of LARGURAS) {
  await p.setViewport({ width: w, height: 900 })
  for (const r of ROTAS) {
    await p.goto(BASE + r, { waitUntil: 'networkidle0' })
    await p.addStyleTag({ content: '*{content-visibility:visible!important}' })
    const alt = await p.evaluate((sel) => {
      const o = {}
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el)
        const nome = [...el.classList].find((c) => !c.startsWith('secao')) || el.className
        o[nome] = Math.round(el.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom))
      }
      return o
    }, SEL)
    for (const [k, v] of Object.entries(alt)) (res[k] ||= {})[w] = Math.max(res[k][w] || 0, v)
  }
}
await b.close()
for (const [k, v] of Object.entries(res)) console.log(k.padEnd(12), LARGURAS.map((w) => `${w}:${v[w]}`).join('  '))
