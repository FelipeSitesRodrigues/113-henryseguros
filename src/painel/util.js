// Utilidades do painel: DOM, avisos, diálogos, imagens e datas.
import { icone } from './icones.js'

export const $ = (sel, raiz = document) => raiz.querySelector(sel)
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)]

export function esc(txt) {
  return String(txt ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

/* ---------------------------------------------------------------- avisos (toast) */
export function aviso(texto, tipo = 'ok') {
  const caixa = $('#avisos')
  const el = document.createElement('div')
  el.className = `aviso aviso--${tipo}`
  el.setAttribute('role', tipo === 'erro' ? 'alert' : 'status')
  el.innerHTML = `${icone(tipo === 'erro' ? 'warning' : 'check-circle')}<span>${esc(texto)}</span>`
  caixa.append(el)
  requestAnimationFrame(() => el.classList.add('aviso--on'))
  setTimeout(() => {
    el.classList.remove('aviso--on')
    setTimeout(() => el.remove(), 400)
  }, tipo === 'erro' ? 7000 : 4200)
}

/* ---------------------------------------------------------------- diálogo de confirmação */
export function confirmar({ titulo, texto = '', sim = 'Confirmar', nao = 'Cancelar', perigo = false }) {
  return new Promise(resolve => {
    const d = document.createElement('dialog')
    d.className = 'dialogo'
    d.innerHTML = `
      <form method="dialog" class="dialogo__caixa">
        <h2 class="dialogo__titulo">${esc(titulo)}</h2>
        ${texto ? `<p class="dialogo__texto">${esc(texto)}</p>` : ''}
        <div class="dialogo__botoes">
          <button class="btn btn--leve" value="nao">${esc(nao)}</button>
          <button class="btn ${perigo ? 'btn--perigo' : 'btn--primario'}" value="sim">${esc(sim)}</button>
        </div>
      </form>`
    document.body.append(d)
    d.addEventListener('close', () => { resolve(d.returnValue === 'sim'); d.remove() })
    d.showModal()
    $('[value="sim"]', d).focus()
  })
}

/* ---------------------------------------------------------------- botão ocupado */
export async function ocupado(botao, fn) {
  if (botao.disabled) return
  botao.disabled = true
  botao.classList.add('btn--carregando')
  try { return await fn() } finally {
    botao.disabled = false
    botao.classList.remove('btn--carregando')
  }
}

/* ---------------------------------------------------------------- texto */
export function slugificar(txt) {
  return String(txt || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

export function contador(campo, saida, max) {
  const att = () => {
    const n = campo.value.length
    saida.textContent = `${n} de ${max}`
    saida.classList.toggle('contador--passou', n > max)
  }
  campo.addEventListener('input', att)
  att()
}

// textarea que cresce com o texto
export function autoAltura(t) {
  const ajusta = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px' }
  t.addEventListener('input', ajusta)
  requestAnimationFrame(ajusta)
}

/* ---------------------------------------------------------------- datas */
const pad = n => String(n).padStart(2, '0')
export function quando(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const hoje = new Date()
  const ontem = new Date(); ontem.setDate(hoje.getDate() - 1)
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (d.toDateString() === hoje.toDateString()) return `hoje às ${hora}`
  if (d.toDateString() === ontem.toDateString()) return `ontem às ${hora}`
  const ano = d.getFullYear() !== hoje.getFullYear() ? `/${d.getFullYear()}` : ''
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}${ano} às ${hora}`
}
export function dataCurta(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}
// valor de <input type="date"> a partir do ISO (data local)
export function paraInputData(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
// do <input type="date"> pro banco: meio-dia no horário de Brasília, pra data não virar de dia
export function deInputData(v) {
  return v ? `${v}T12:00:00-03:00` : null
}

/* ---------------------------------------------------------------- imagens */
// Reduz no navegador e codifica em WebP 0,86. Devolve { blob, ext, tipo, largura, altura, larguraOriginal }.
export async function prepararImagem(arquivo, larguraMax) {
  if (!/^image\//.test(arquivo.type)) throw new Error('Escolha um arquivo de imagem (JPG, PNG ou WebP).')
  let fonte
  try {
    fonte = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  } catch {
    fonte = await new Promise((ok, erro) => {
      const img = new Image()
      img.onload = () => ok(img)
      img.onerror = () => erro(new Error('Não consegui abrir essa imagem. Tente outra foto.'))
      img.src = URL.createObjectURL(arquivo)
    })
  }
  const lo = fonte.width, ao = fonte.height
  const escala = Math.min(1, larguraMax / lo)
  const largura = Math.round(lo * escala), altura = Math.round(ao * escala)
  const canvas = document.createElement('canvas')
  canvas.width = largura; canvas.height = altura
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(fonte, 0, 0, largura, altura)
  fonte.close?.()
  let blob = await new Promise(ok => canvas.toBlob(ok, 'image/webp', 0.86))
  let ext = 'webp'
  // navegador sem WebP no canvas (Safari antigo) devolve PNG: cai pra JPEG
  if (!blob || blob.type !== 'image/webp') {
    blob = await new Promise(ok => canvas.toBlob(ok, 'image/jpeg', 0.86))
    ext = 'jpg'
  }
  if (!blob) throw new Error('Não consegui preparar essa imagem.')
  if (blob.size > 8 * 1024 * 1024) throw new Error('A imagem ficou maior que 8 MB. Tente uma foto menor.')
  return { blob, ext, tipo: blob.type, largura, altura, larguraOriginal: lo }
}

export function uuid() {
  return crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16) })
}

// pede um arquivo de imagem ao usuário
export function escolherArquivo() {
  return new Promise(resolve => {
    const inp = document.createElement('input')
    inp.type = 'file'
    inp.accept = 'image/jpeg,image/png,image/webp,image/avif'
    inp.style.display = 'none'
    inp.addEventListener('change', () => { resolve(inp.files[0] || null); inp.remove() })
    document.body.append(inp)
    inp.click()
  })
}

/* ---------------------------------------------------------------- localStorage (só conveniência) */
export function lerLocal(chave) {
  try { return localStorage.getItem(chave) } catch { return null }
}
export function gravarLocal(chave, valor) {
  try { valor == null ? localStorage.removeItem(chave) : localStorage.setItem(chave, valor) } catch { /* sem armazenamento */ }
}
