/**
 * Trace do carregamento no celular (390x844, CPU 4x mais lenta) e o resumo do que ocupa a
 * thread principal: soma por nome de evento e as tarefas longas com o que tem dentro.
 *
 * Uso: node scripts/perfil.mjs [rota]   (com o servidor no ar)
 */
import puppeteer from 'puppeteer-core'
import { readFileSync, rmSync } from 'node:fs'

const rota = (process.argv[2] || '/').replace(/^.*?\/Git(\/|$)/i, '/')
const BASE = process.env.BASE_URL ?? 'http://localhost:3113'
const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new' })
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
if (process.env.CSS) await p.evaluateOnNewDocument((css) => document.addEventListener('DOMContentLoaded', () => document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`)), process.env.CSS)
const cdp = await p.createCDPSession()
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
const arq = 'scripts/.trace.json'
await p.tracing.start({ path: arq, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink', 'cc', 'gpu', 'viz'] })
await p.goto(BASE + rota, { waitUntil: 'load' })
await new Promise((r) => setTimeout(r, 4000))
await p.tracing.stop()
await b.close()
const { traceEvents } = JSON.parse(readFileSync(arq, 'utf8'))
rmSync(arq)
const principal = traceEvents.find((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain')
const soma = {}
for (const e of traceEvents) {
  if (e.ph !== 'X' || !e.dur || e.tid !== principal?.tid || e.pid !== principal?.pid) continue
  soma[e.name] = (soma[e.name] || 0) + e.dur / 1000
}
console.log(`quadros: ${traceEvents.filter((e) => e.name === 'ProxyMain::BeginMainFrame').length}`)
console.log('thread principal, por evento (ms, inclui aninhados):')
for (const [n, d] of Object.entries(soma).sort((a, b) => b[1] - a[1]).slice(0, 18)) console.log(`  ${d.toFixed(0).padStart(6)}  ${n}`)
const tarefas = traceEvents.filter((e) => e.name === 'RunTask' && e.tid === principal?.tid && e.pid === principal?.pid && e.dur > 50000)
console.log(`\ntarefas acima de 50 ms: ${tarefas.length}`)
for (const t of tarefas.slice(0, 8)) {
  const dentro = {}
  for (const e of traceEvents) if (e.tid === t.tid && e.pid === t.pid && e.ph === 'X' && e.ts >= t.ts && e.ts + (e.dur || 0) <= t.ts + t.dur && e !== t) dentro[e.name] = (dentro[e.name] || 0) + (e.dur || 0) / 1000
  console.log(`  ${(t.dur / 1000).toFixed(0)} ms: ${Object.entries(dentro).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, d]) => `${n} ${d.toFixed(0)}`).join(', ')}`)
}
