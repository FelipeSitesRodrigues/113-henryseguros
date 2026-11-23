// Estado compartilhado do painel e acesso ao Supabase.
import { gravarLocal, lerLocal, uuid, prepararImagem } from './util.js'

export const app = {
  sb: null, // cliente do Supabase
  cfg: null, // config.json
  conteudo: {}, // linhas da tabela conteudo: { textos: {...}, imagens: {...}, ... }
  sujo: false, // a tela atual tem alteração sem salvar
}

const CHAVE_PENDENTE = 'henry-painel-pendente'

export function marcarSujo(v = true) { app.sujo = v }

/* ---------------------------------------------------------------- conteúdo do site */
export async function carregarConteudo() {
  const { data, error } = await app.sb.from('conteudo').select('chave, valor')
  if (error) throw error
  app.conteudo = Object.fromEntries((data || []).map(l => [l.chave, l.valor]))
  return app.conteudo
}

export async function salvarConteudo(chave, valor) {
  const { error } = await app.sb.from('conteudo').upsert({ chave, valor, atualizado_em: new Date().toISOString() }, { onConflict: 'chave' })
  if (error) throw error
  app.conteudo[chave] = valor
  marcarPendente()
}

/* ---------------------------------------------------------------- imagens no Storage */
// pasta: 'blog' (1600 px) ou 'site' (2400 px). Devolve { url, largura, altura, larguraOriginal, caminho }.
export async function enviarImagem(arquivo, pasta, nome = '') {
  const larguraMax = pasta === 'site' ? 2400 : 1600
  const img = await prepararImagem(arquivo, larguraMax)
  const caminho = pasta === 'site' ? `site/${nome}-${Date.now()}.${img.ext}` : `blog/${uuid()}.${img.ext}`
  const { error } = await app.sb.storage.from('midia').upload(caminho, img.blob, { contentType: img.tipo, cacheControl: '31536000', upsert: false })
  if (error) throw new Error(traduzErro(error))
  const { data } = app.sb.storage.from('midia').getPublicUrl(caminho)
  return { url: data.publicUrl, caminho, largura: img.largura, altura: img.altura, larguraOriginal: img.larguraOriginal }
}

// caminho dentro do bucket a partir da URL pública (null se não for do nosso bucket)
export function caminhoDaUrl(url) {
  const m = /\/storage\/v1\/object\/public\/midia\/(.+)$/.exec(url || '')
  return m ? decodeURIComponent(m[1]) : null
}

/* ---------------------------------------------------------------- publicar */
export function marcarPendente(v = true) {
  gravarLocal(CHAVE_PENDENTE, v ? '1' : null)
  document.dispatchEvent(new CustomEvent('pendente'))
}
export const temPendente = () => lerLocal(CHAVE_PENDENTE) === '1'

export async function ultimaPublicacao() {
  const { data } = await app.sb.from('publicacoes').select('pedido_em, ok, detalhe').order('pedido_em', { ascending: false }).limit(1)
  return data?.[0] || null
}

export async function publicarSite() {
  const { data, error } = await app.sb.rpc('publicar')
  if (error) return { ok: false, mensagem: traduzErro(error) }
  if (data?.ok) marcarPendente(false)
  document.dispatchEvent(new CustomEvent('publicou'))
  return data || { ok: false, mensagem: 'Resposta vazia do servidor.' }
}

/* ---------------------------------------------------------------- erros em português */
export function traduzErro(e) {
  const msg = String(e?.message || e || '')
  if (e?.code === '23505') return 'Já existe um post com esse endereço. Mude o endereço do post e salve de novo.'
  if (e?.code === '23514') return 'Algum campo está fora do formato aceito. Confira o título (3 a 160 letras) e o endereço do post.'
  if (e?.code === '42501' || /row-level security|permission denied/i.test(msg)) return 'Sem permissão para essa ação. Entre de novo no painel.'
  if (/JWT expired|invalid jwt/i.test(msg)) return 'Sua sessão expirou. Entre de novo no painel.'
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'Sem conexão com a internet. Confira e tente de novo.'
  if (/exceeded the maximum allowed size|Payload too large/i.test(msg)) return 'A imagem passou de 8 MB. Use uma foto menor.'
  if (/mime type/i.test(msg)) return 'Formato de imagem não aceito. Use JPG, PNG ou WebP.'
  return msg || 'Algo deu errado. Tente de novo.'
}
