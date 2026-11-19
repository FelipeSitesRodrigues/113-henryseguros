/**
 * Pedaços da logo pra abertura (modelo da 0105 Ston e da 0104 Lume): o símbolo das folhas,
 * as letras de "Henry" e a linha "SEGUROS", cada um num WebP transparente, saídos do mesmo
 * SVG da logo (src/partials/x-logo.html). Cortes medidos na logo rasterizada a 4x
 * (3344x1120); o CSS (97-abertura.css) põe cada pedaço no lugar em % dessa caixa.
 * Fica em src/assets/abertura/ (o processar-imagens.mjs limpa a src/assets/img).
 *
 * Uso: node scripts/abertura.mjs
 */
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'node:fs'

const W = 3344
const H = 1120
const K = 0.3 // saída: a logo inteira com ~1000 px de largura (tela retina até ~500 px)
const PEDACOS = {
  simbolo: [0, 0, 880, 1120],
  h: [1186, 355, 1684, 925],
  e: [1686, 470, 2124, 925],
  n: [2126, 470, 2546, 925],
  r: [2548, 478, 2864, 925],
  y: [2870, 478, 3344, 1006],
  seguros: [1880, 994, 2644, 1118],
}
const OUT = 'src/assets/abertura'
mkdirSync(OUT, { recursive: true })
const svg = readFileSync('src/partials/x-logo.html', 'utf8')
const base = await sharp(Buffer.from(svg), { density: 72 * 4 }).ensureAlpha().png().toBuffer()
const css = []
for (const [nome, [x0, y0, x1, y1]] of Object.entries(PEDACOS)) {
  const w = Math.round((x1 - x0) * K)
  const h = Math.round((y1 - y0) * K)
  await sharp(base).extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).resize(w, h, { kernel: 'lanczos3' }).webp({ quality: 92, alphaQuality: 100 }).toFile(`${OUT}/${nome}.webp`)
  const pc = (v, t) => `${((v / t) * 100).toFixed(2)}%`
  css.push(`${nome}: left ${pc(x0, W)}; top ${pc(y0, H)}; width ${pc(x1 - x0, W)}  (${w}x${h})`)
}
console.log(css.join('\n'))
