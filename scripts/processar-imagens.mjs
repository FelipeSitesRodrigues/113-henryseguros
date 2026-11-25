/**
 * Gera as imagens do site a partir de "../0113 - Henry Seguros/Recursos Site", em
 * src/assets/img, em AVIF e WebP e em várias larguras pra srcset. Grava
 * src/assets/img/manifesto.json com largura e altura de cada arquivo (width/height do <img>).
 *
 * Fotos (geradas no ChatGPT a partir dos mockups aprovados, versões limpas em fotos/):
 * - hero: dois homens apertando as mãos contra o céu (hero-aperto-de-mao.png; o Paulo pediu pra não
 *   estar no hero, a foto dele com o cliente, hero-paulo.png, ficou guardada)
 * - topo-<seguro>: o topo de cada página de seguro (pagina-<seguro>.png); recortada em
 *   retrato 3:4 (card-<seguro>) vira o cartão da seção Soluções da Home
 * - celular: mão com o celular no carro (seção Diferenciais). A tela veio verde (#00FF00): aqui
 *   o verde vira o fundo escuro da conversa do WhatsApp e a posição da tela vai pra
 *   src/dados/celular.json, onde o HTML da conversa encaixa por cima
 * - estrada (Como funciona), mulher (Objeções), ceu (chamada final), paulo (Sobre)
 * - seg-<nome>: logos das seguradoras numa cor só (petróleo), pra faixa debaixo do hero
 * - og-henry.jpg: imagem de compartilhamento (1200x630)
 *
 * Uso: node scripts/processar-imagens.mjs   (ou npm run imagens)
 */
import sharp from 'sharp'
import { mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const R = '../0113 - Henry Seguros/Recursos Site'
const F = `${R}/fotos`
const OUT = 'src/assets/img'
mkdirSync(OUT, { recursive: true })
for (const f of readdirSync(OUT)) rmSync(path.join(OUT, f), { recursive: true, force: true })
const manifesto = {}

async function gravar(pipeline, nome) {
  const info = await pipeline.toFile(path.join(OUT, nome))
  manifesto[nome] = { w: info.width, h: info.height, kb: Math.round(info.size / 1024) }
}

// uma imagem (arquivo ou buffer) em várias larguras, AVIF e WebP
async function variantes(origem, nome, larguras, { q = 76, alfa = false } = {}) {
  const meta = await sharp(origem).metadata()
  for (const w of larguras) {
    if (w > meta.width) continue
    for (const f of ['avif', 'webp']) {
      let p = sharp(origem).resize({ width: w, kernel: 'lanczos3' })
      p = f === 'avif' ? p.avif({ quality: q - 24, effort: 7, chromaSubsampling: alfa ? '4:4:4' : '4:2:0' }) : p.webp({ quality: q, effort: 6, smartSubsample: true, ...(alfa ? { alphaQuality: 90 } : {}) })
      await gravar(p, `${nome}-${w}.${f}`)
    }
  }
}

const LARGA = [640, 960, 1280, 1672]

// ---------------------------------------------------------------- hero e topos das páginas
await variantes(`${F}/hero-aperto-de-mao.png`, 'hero', LARGA)
// topo da página Sobre: o Paulo no escritório da Henry (foto própria, pra não repetir o hero)
await variantes(`${F}/sobre-topo-escritorio.png`, 'sobre-topo', LARGA)
// seção das imobiliárias (Home): o corretor entregando as chaves
await variantes(`${F}/imobiliarias-chaves.png`, 'imob', [480, 720, 933])

// foco horizontal do assunto de cada foto (0 = esquerda, 1 = direita), pro recorte do cartão
const SEGUROS = { auto: 0.8, residencial: 0.7, empresarial: 0.73, frota: 0.74, fianca: 0.72, capitalizacao: 0.68, 'responsabilidade-civil': 0.76, saude: 0.7 }
for (const [id, foco] of Object.entries(SEGUROS)) {
  // plano de saúde: até chegar a foto própria (pagina-saude.png), o topo usa o céu da chamada final
  const arq = existsSync(`${F}/pagina-${id}.png`) ? `${F}/pagina-${id}.png` : `${F}/cta-ceu.png`
  await variantes(arq, `topo-${id}`, LARGA)
  const { width: W, height: H } = await sharp(arq).metadata()
  const w = Math.round(H * 0.75)
  const left = Math.max(0, Math.min(W - w, Math.round(foco * W - w / 2)))
  const card = await sharp(arq).extract({ left, top: 0, width: w, height: H }).toBuffer()
  await variantes(card, `card-${id}`, [360, 540, 706])
}

// ---------------------------------------------------------------- celular com a tela verde
{
  const arq = `${F}/diferenciais-celular-tela-verde.png`
  const { data, info } = await sharp(arq).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  // verde chapado: g alto e muito acima de r e b. A franja (verde misturado com a moldura do
  // aparelho) vira a mistura proporcional com o fundo escuro, sem halo
  const FUNDO = [11, 20, 26] // #0b141a, fundo da conversa do WhatsApp no tema escuro
  let x0 = W, y0 = H, x1 = 0, y1 = 0
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2]
    const verde = Math.max(0, Math.min(1, (g - Math.max(r, b) - 40) / 120))
    if (verde <= 0) continue
    for (let k = 0; k < 3; k++) {
      const orig = k === 1 ? Math.max(r, b) : data[i * 3 + k] // tira o verde da franja
      data[i * 3 + k] = Math.round(orig * (1 - verde) + FUNDO[k] * verde)
    }
    if (verde > 0.9) {
      const x = i % W, y = (i / W) | 0
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  const limpa = await sharp(data, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer()
  await variantes(limpa, 'celular', LARGA)
  const tela = { x: +(x0 / W * 100).toFixed(3), y: +(y0 / H * 100).toFixed(3), w: +((x1 - x0 + 1) / W * 100).toFixed(3), h: +((y1 - y0 + 1) / H * 100).toFixed(3), proporcao: +((x1 - x0 + 1) / (y1 - y0 + 1)).toFixed(4), largura: W, altura: H }
  writeFileSync('src/dados/celular.json', JSON.stringify(tela, null, 2) + '\n')
  console.log('tela do celular', tela)
}

// ---------------------------------------------------------------- seções
await variantes(`${F}/como-funciona-estrada.png`, 'estrada', LARGA)
await variantes(`${F}/objecoes-mulher-janela.png`, 'mulher', [400, 600, 800, 1086])
await variantes(`${F}/cta-ceu.png`, 'ceu', LARGA)
await variantes(`${R}/paulo/paulo-sobre-final.png`, 'paulo', [400, 600, 800, 1024])

// ---------------------------------------------------------------- logos das seguradoras (uma cor só)
// Tinta = o que não é fundo branco. A Suhai vem num retângulo verde-limão: ali a tinta é só o
// texto escuro. Sai em petróleo #004854 com a transparência da tinta, 72 px de altura (2x de 36).
// Planos de saúde (seção 03d-saude): Amil (Wikimedia), Alice e Omint (sites oficiais; os dois
// vêm em branco, então ali a tinta é a própria transparência). Bradesco, Porto e SulAmérica
// reaproveitam os logos das seguradoras.
const SEG = [
  ...['porto.svg', 'tokio.svg', 'bradesco.svg', 'allianz.svg', 'hdi.png', 'yelum.svg', 'sulamerica.png', 'zurich.svg', 'suhai.svg'].map((a) => [`${R}/seguradoras/${a}`, a]),
  ...['amil.svg', 'alice.svg', 'omint.png'].map((a) => [`${R}/planos-saude/${a}`, a]),
]
const NEGATIVOS = ['alice', 'omint']
for (const [origem, arq] of SEG) {
  const nome = arq.replace(/\.\w+$/, '')
  const { data, info } = await sharp(origem, { density: 400 }).resize({ height: 300 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const out = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3] / 255
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    const tinta = NEGATIVOS.includes(nome) ? 1 : nome === 'suhai' ? Math.max(0, Math.min(1, (0.45 - lum) / 0.25)) : Math.max(0, Math.min(1, (0.93 - lum) / 0.2))
    out[i * 4] = 0
    out[i * 4 + 1] = 72
    out[i * 4 + 2] = 84
    out[i * 4 + 3] = Math.round(255 * a * tinta)
  }
  const buf = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer()
  const m = await sharp(buf).metadata()
  const w = Math.round((m.width * 72) / m.height)
  for (const f of ['avif', 'webp']) {
    const p = sharp(buf).resize({ height: 72 })
    await gravar(f === 'avif' ? p.avif({ quality: 60, effort: 7, chromaSubsampling: '4:4:4' }) : p.webp({ quality: 88, alphaQuality: 90, effort: 6 }), `seg-${nome}-${w}.${f}`)
  }
}

// ---------------------------------------------------------------- compartilhamento (1200x630)
{
  const logo = readFileSync('src/partials/x-logo.html', 'utf8').replace('<svg ', '<svg width="380" height="127" ')
  const veu = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#03252b" stop-opacity=".75"/><stop offset=".55" stop-color="#03252b" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>`)
  const og = await sharp(`${F}/hero-aperto-de-mao.png`)
    .resize(1200, 630, { fit: 'cover', position: 'right' })
    .composite([{ input: veu }, { input: Buffer.from(logo), top: 60, left: 60 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()
  writeFileSync(path.join(OUT, 'og-henry.jpg'), og)
  manifesto['og-henry.jpg'] = { w: 1200, h: 630, kb: Math.round(og.length / 1024) }
}

writeFileSync(path.join(OUT, 'manifesto.json'), JSON.stringify(manifesto, null, 1))
const total = Object.values(manifesto).reduce((s, m) => s + m.kb, 0)
console.log(`ok ${Object.keys(manifesto).length} arquivos, ${total} KB`)
