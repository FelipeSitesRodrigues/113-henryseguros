// Kit de animações (skill /animacoes-site): quebra os títulos com data-palavras em letras,
// no BUILD (Node). Importar no build.mjs e passar o HTML montado por letras(html).
//
// Cada palavra vira <span class="pw"><span class="pw__i"> (a palavra não quebra no meio) e
// cada letra um <span class="pc" style="--c:N">, com N em sequência no título inteiro. Tags
// dentro (br, strong, em) passam direto. <span class="tarja">...</span> conta como uma letra
// só e entra inteira. Leitor de tela soletraria as letras soltas: o texto inteiro vai no
// aria-label (só em h1-h3; <p> não aceita aria-label, então ali a palavra entra inteira).
export function letras(html) {
  return html.replace(/<(h1|h2|h3|p)(\s[^>]*?\bdata-palavras\b[^>]*)>([\s\S]*?)<\/\1>/g, (_, nome, attrs, miolo) => {
    const blocos = []
    const rotulo = miolo.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    miolo = miolo.replace(/<span class="tarja">[\s\S]*?<\/span>/g, (b) => `\u0001${blocos.push(b) - 1}\u0001`)
    let c = 0
    const separar = (w) => (nome === 'p' ? [w] : w.match(/&[^;\s]+;|\u0001\d+\u0001|./gsu)).map((l) => {
      const bloco = l.match(/^\u0001(\d+)\u0001$/)
      return bloco ? `<span class="pc pc--bloco" style="--c:${c++}">${blocos[bloco[1]]}</span>` : `<span class="pc" style="--c:${c++}">${l}</span>`
    }).join('')
    const out = miolo
      .split(/(<[^>]+>)/)
      .map((parte) => (parte.startsWith('<') ? parte : parte.replace(/\S+/g, (w) => `<span class="pw"><span class="pw__i">${separar(w)}</span></span>`)))
      .join('')
      .replace(/\u0001(\d+)\u0001/g, (_, i) => blocos[i])
    const aria = nome === 'p' || /\baria-label=/.test(attrs) ? '' : ` aria-label="${rotulo.replace(/"/g, '&quot;')}"`
    return `<${nome}${attrs}${aria}>${out}</${nome}>`
  })
}
