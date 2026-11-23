/**
 * Conteúdo do painel (Supabase) na hora do build.
 *
 * O site continua estático: o build lê aqui, com a chave pública (o RLS só deixa ler post
 * publicado e o conteúdo do site), e gera as páginas. O Paulo edita no /painel e o botão
 * Publicar dispara um build novo na Vercel.
 *
 * - carregarCms(): posts publicados e as linhas da tabela conteudo (textos, imagens, contato,
 *   depoimentos, faq). Sem rede, no PC, segue com o padrão do código e avisa; na Vercel
 *   (obrigatorio) falha o build, pra não publicar um site sem o blog.
 * - variantesCms(): baixa uma imagem do Storage e grava AVIF e WebP nas larguras pedidas em
 *   dist/assets/img/cms/, com o hash da origem no nome (o cache de 30 dias das imagens não
 *   prende foto velha). Cache em node_modules/.cache, que a Vercel guarda entre builds.
 */
import sharp from 'sharp'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const BLOCOS = ['textos', 'imagens', 'contato', 'depoimentos', 'faq']
const CAMPOS_POST = 'slug,titulo,resumo,conteudo,capa_url,capa_alt,categoria,publicado_em,atualizado_em,seo_titulo,seo_descricao'

export async function carregarCms({ cfg, obrigatorio = false, avisos = [] }) {
  const { url, chave } = cfg.cms || {}
  const vazio = { posts: [], textos: {}, imagens: {}, contato: null, depoimentos: null, faq: null, online: false }
  if (!url || !chave) {
    if (obrigatorio) throw new Error('cms.url e cms.chave faltando no site.config.json')
    avisos.push('cms: sem url/chave no config, usando só o padrão do código')
    return vazio
  }
  const h = { apikey: chave, Authorization: `Bearer ${chave}` }
  const pedir = async (rota) => {
    const r = await fetch(`${url}/rest/v1/${rota}`, { headers: h, signal: AbortSignal.timeout(20000) })
    if (!r.ok) throw new Error(`cms: ${rota.split('?')[0]} respondeu ${r.status} ${await r.text()}`)
    return r.json()
  }
  try {
    const [posts, linhas] = await Promise.all([
      pedir(`posts?select=${CAMPOS_POST}&status=eq.publicado&order=publicado_em.desc`),
      pedir('conteudo?select=chave,valor'),
    ])
    const agora = Date.now() + 10 * 60 * 1000 // folga: relógio da máquina atrás do servidor
    const bloco = Object.fromEntries(linhas.filter((l) => BLOCOS.includes(l.chave)).map((l) => [l.chave, l.valor]))
    return {
      // post agendado (data no futuro) entra no primeiro build depois da data
      posts: posts.filter((p) => !p.publicado_em || Date.parse(p.publicado_em) <= agora),
      textos: objeto(bloco.textos),
      imagens: objeto(bloco.imagens),
      contato: bloco.contato && typeof bloco.contato === 'object' ? bloco.contato : null,
      depoimentos: Array.isArray(bloco.depoimentos) && bloco.depoimentos.length ? bloco.depoimentos : null,
      faq: Array.isArray(bloco.faq) && bloco.faq.length ? bloco.faq : null,
      online: true,
    }
  } catch (e) {
    if (obrigatorio) throw e
    avisos.push(`cms: sem conexão com o Supabase (${e.message}); build só com o padrão do código`)
    return vazio
  }
}

const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})

// ---------------------------------------------------------------- imagens do Storage
let raizCache = null
export function iniciarCacheCms(raiz) {
  raizCache = path.join(raiz, 'node_modules/.cache/henry-cms')
  mkdirSync(raizCache, { recursive: true })
}

// só imagem do próprio bucket: o build não baixa endereço qualquer que alguém cole no painel
export const ehDoStorage = (cfg, src) => typeof src === 'string' && src.startsWith(`${cfg.cms?.url}/storage/v1/object/public/midia/`)

const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 10)

async function baixar(src) {
  const arq = path.join(raizCache, `${hash(src)}.bin`)
  if (existsSync(arq)) return readFileSync(arq)
  const r = await fetch(src, { signal: AbortSignal.timeout(30000) })
  if (!r.ok) throw new Error(`imagem ${r.status}: ${src}`)
  const buf = Buffer.from(await r.arrayBuffer())
  writeFileSync(arq, buf)
  return buf
}

/**
 * Gera as versões de uma imagem do Storage.
 *   nome: prefixo do arquivo (ex.: "hero", "post-capa-meu-slug")
 *   larguras: [640, 960, ...] (largura maior que a original fica de fora)
 *   proporcao: largura/altura pra recortar (cover, foco no assunto) ou null pra manter a da foto
 *   jpg: também um JPG na maior largura (og:image)
 * Devolve [{ arq: 'cms/nome-hash-640.avif', m: { w, h }, w }] no formato do manifesto.
 */
export async function variantesCms(src, { dist, nome, larguras, proporcao = null, jpg = false, q = 76 }) {
  const buf = await baixar(src)
  const meta = await sharp(buf).metadata()
  const h8 = hash(src)
  const pasta = path.join(dist, 'assets/img/cms')
  mkdirSync(pasta, { recursive: true })
  const saida = []
  const ls = larguras.filter((w) => w <= meta.width)
  if (!ls.length) ls.push(meta.width)
  for (const w of ls) {
    const h = proporcao ? Math.round(w / proporcao) : Math.round((meta.height * w) / meta.width)
    for (const ext of jpg && w === ls[ls.length - 1] ? ['avif', 'webp', 'jpg'] : ['avif', 'webp']) {
      const arq = `cms/${nome}-${h8}-${w}.${ext}`
      const destino = path.join(dist, 'assets/img', arq)
      const cache = path.join(raizCache, path.basename(arq))
      if (!existsSync(cache)) {
        let p = sharp(buf).rotate().resize({ width: w, height: proporcao ? h : undefined, fit: 'cover', position: sharp.strategy.attention })
        p = ext === 'avif' ? p.avif({ quality: q - 24, effort: 4 }) : ext === 'webp' ? p.webp({ quality: q, effort: 5 }) : p.flatten({ background: '#ffffff' }).jpeg({ quality: 82, mozjpeg: true })
        await p.toFile(cache)
      }
      writeFileSync(destino, readFileSync(cache))
      if (ext !== 'jpg') saida.push({ arq, m: { w, h }, w })
      else saida.og = arq
    }
  }
  return saida
}
