/**
 * Logo da Henry em SVG, tirada do PDF do brand book (LOGOS- Henry.pdf, Estúdio Molina).
 * O PDF é vetor: a página 7 (horizontal sobre petróleo) e a 12 (símbolo sobre petróleo) foram
 * exportadas pra SVG (pymupdf) em "../0113 - Henry Seguros/Recursos Site/_logo-p7.svg" e
 * "_logo-p12.svg". Aqui sai o retângulo do fundo e o viewBox fecha no desenho.
 *
 * Saída:
 * - src/partials/x-logo.html     a logo horizontal (branco + verde), inline no header e no rodapé
 * - src/raiz/favicon*.png, apple-touch-icon.png, icon-*.png, favicon.ico   do símbolo
 *
 * Uso: node scripts/logo.mjs
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const R = '../0113 - Henry Seguros/Recursos Site'
const PETROLEO = '#004854'

function limpar(svg) {
  return svg
    .replace(/<path[^>]*d="M0 0H1080V1080H0Z"[^>]*\/>/, '') // fundo petróleo
    .replace(/\s+inkscape:[\w]+="[^"]*"/g, '')
    .replace(/\s+xmlns:inkscape="[^"]*"/, '')
    .replace(/\s+xmlns:xlink="[^"]*"/, '')
    .replace(/\n\s*/g, ' ')
}

// caixa do desenho: renderiza e mede o que não é transparente
async function caixa(svg) {
  const { data, info } = await sharp(Buffer.from(svg), { density: 72 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
  return { x: x0 - 2, y: y0 - 2, w: x1 - x0 + 5, h: y1 - y0 + 5 }
}

const recortar = (svg, c) => svg.replace(/width="1080" height="1080" viewBox="0 0 1080 1080"/, `viewBox="${c.x} ${c.y} ${c.w} ${c.h}"`)

const horizontal = limpar(readFileSync(`${R}/_logo-p7.svg`, 'utf8'))
const ch = await caixa(horizontal)
const logo = recortar(horizontal, ch)
  .replace('<svg ', '<svg class="logo" role="img" aria-label="Henry Seguros" focusable="false" ')
  // o clipPath do PDF é a página inteira (não corta nada) e repetiria o id no header e no rodapé
  .replace(/<defs>[\s\S]*?<\/defs>/, '')
  .replace(/ clip-path="url\(#clip_1\)"/g, '')
  .replace(/\s+/g, ' ')
  .replace(/> </g, '><')
  .trim()
writeFileSync('src/partials/x-logo.html', logo + '\n')
console.log('ok src/partials/x-logo.html', ch, `${(logo.length / 1024).toFixed(1)} KB`)

// favicons: o símbolo (branco e verde) sobre um quadrado petróleo de canto arredondado
const simbolo = limpar(readFileSync(`${R}/_logo-p12.svg`, 'utf8'))
const cs = await caixa(simbolo)
const lado = Math.max(cs.w, cs.h) * 1.42
const svgIcone = (raio) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${cs.x + cs.w / 2 - lado / 2} ${cs.y + cs.h / 2 - lado / 2} ${lado} ${lado}"><rect x="${cs.x + cs.w / 2 - lado / 2}" y="${cs.y + cs.h / 2 - lado / 2}" width="${lado}" height="${lado}" rx="${lado * raio}" fill="${PETROLEO}"/>${simbolo.replace(/^[\s\S]*?<defs>/, '<defs>').replace(/<\/svg>\s*$/, '')}</svg>`
mkdirSync('src/raiz', { recursive: true })
const png = (svg, w, arq) => sharp(Buffer.from(svg), { density: 300 }).resize(w, w).png({ compressionLevel: 9 }).toFile(`src/raiz/${arq}`)
await png(svgIcone(0.22), 32, 'favicon-32.png')
await png(svgIcone(0), 180, 'apple-touch-icon.png')
await png(svgIcone(0.22), 192, 'icon-192.png')
await png(svgIcone(0.22), 512, 'icon-512.png')
// favicon.ico com um PNG 32x32 dentro (todo navegador atual lê)
const p32 = readFileSync('src/raiz/favicon-32.png')
const ico = Buffer.alloc(22)
ico.writeUInt16LE(0, 0)
ico.writeUInt16LE(1, 2)
ico.writeUInt16LE(1, 4)
ico.writeUInt8(32, 6)
ico.writeUInt8(32, 7)
ico.writeUInt16LE(1, 10)
ico.writeUInt16LE(32, 12)
ico.writeUInt32LE(p32.length, 14)
ico.writeUInt32LE(22, 18)
writeFileSync('src/raiz/favicon.ico', Buffer.concat([ico, p32]))
console.log('ok favicons', cs)
