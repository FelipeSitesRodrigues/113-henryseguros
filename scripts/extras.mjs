/**
 * Imagens da seção de imobiliárias sem rodar o processar-imagens.mjs inteiro (que demora e
 * apaga a src/assets/img): a foto das chaves em AVIF/WebP (entra no manifesto.json) e a logo
 * da Porto em branco pro selo de vidro (src/assets/extra/porto-branco.webp). O processar
 * também gera a foto, então rodar ele depois não perde nada.
 *
 * Uso: node scripts/extras.mjs
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const R = '../0113 - Henry Seguros/Recursos Site'
const IMG = 'src/assets/img'
const man = JSON.parse(readFileSync(`${IMG}/manifesto.json`, 'utf8'))
for (const w of [480, 720, 933]) {
  for (const f of ['avif', 'webp']) {
    let p = sharp(`${R}/fotos/imobiliarias-chaves.png`).resize({ width: w, kernel: 'lanczos3' })
    p = f === 'avif' ? p.avif({ quality: 52, effort: 7 }) : p.webp({ quality: 76, effort: 6 })
    const nome = `imob-${w}.${f}`
    const i = await p.toFile(`${IMG}/${nome}`)
    man[nome] = { w: i.width, h: i.height, kb: Math.round(i.size / 1024) }
  }
}
writeFileSync(`${IMG}/manifesto.json`, JSON.stringify(man, null, 1))

// Porto em branco: o azul vira branco opaco e o branco (as velas do símbolo) vira transparente
mkdirSync('src/assets/extra', { recursive: true })
const { data, info } = await sharp(`${R}/seguradoras/_baixado/porto.svg`, { density: 300 }).resize({ height: 96 }).flatten({ background: '#ffffff' }).raw().toBuffer({ resolveWithObject: true })
const out = Buffer.alloc(info.width * info.height * 4)
for (let i = 0; i < info.width * info.height; i++) {
  const r = data[i * info.channels]
  out.fill(255, i * 4, i * 4 + 3)
  out[i * 4 + 3] = 255 - r
}
const l = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).webp({ quality: 92, alphaQuality: 100 }).toFile('src/assets/extra/porto-branco.webp')
console.log('porto-branco', l.width, l.height)
