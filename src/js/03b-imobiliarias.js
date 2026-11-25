// Cadastro de parceiro imobiliário: "Quero ser parceiro" abre a janela (<dialog>); o formulário
// entra do <template> na 1ª abertura (fora do HTML, pro autofill não forçar layout no
// carregamento, memória do 081) e o envio abre o WhatsApp do Paulo com os dados. Sem JS ou sem
// <dialog>, o botão segue o link do WhatsApp.
;(() => {
  const botao = document.querySelector('[data-parceiro]')
  const janela = document.querySelector('.parceiro')
  const molde = document.getElementById('form-parceiro')
  if (!botao || !janela || !molde || typeof janela.showModal !== 'function') return
  const vaga = janela.querySelector('.parceiro__vaga')

  const montar = () => {
    vaga.replaceChildren(molde.content.cloneNode(true))
    const form = vaga.querySelector('form')
    const erro = form.querySelector('.form__erro')
    const tel = form.elements.whatsapp
    tel.addEventListener('input', () => {
      const d = tel.value.replace(/\D/g, '').slice(0, 11)
      tel.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d
    })
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const f = form.elements
      const en = document.documentElement.lang === 'en'
      const campos = [
        [!f.nome.value.trim(), en ? 'your name' : 'seu nome', f.nome],
        [!f.empresa.value.trim(), en ? 'the agency name' : 'o nome da imobiliária', f.empresa],
        [f.whatsapp.value.replace(/\D/g, '').length < 10, en ? 'a WhatsApp number with area code' : 'um WhatsApp com DDD', f.whatsapp],
        [!f.aceite.checked, en ? 'your agreement to the Privacy Policy' : 'o aceite da Política de Privacidade', f.aceite],
      ].filter(([falta]) => falta)
      if (campos.length) {
        erro.textContent = en ? `Missing ${campos.map((c) => c[1]).join(', ').replace(/, ([^,]*)$/, ' and $1')}.` : `Falta ${campos.map((c) => c[1]).join(', ').replace(/, ([^,]*)$/, ' e $1')}.`
        erro.hidden = false
        campos[0][2].focus()
        return
      }
      erro.hidden = true
      const linhas = en ? ["Hi, Paulo! I found Henry's website and want to become a *real estate partner* (rent guarantee insurance).", `Name: ${f.nome.value.trim()}`, `Agency: ${f.empresa.value.trim()}`, `WhatsApp: ${f.whatsapp.value}`] : ['Olá, Paulo! Vim pelo site da Henry e quero ser *parceiro imobiliário* (seguro fiança).', `Nome: ${f.nome.value.trim()}`, `Imobiliária: ${f.empresa.value.trim()}`, `WhatsApp: ${f.whatsapp.value}`]
      if (f.cidade.value.trim()) linhas.push(`${en ? 'City' : 'Cidade'}: ${f.cidade.value.trim()}`)
      if (f.volume.value) linhas.push(`${en ? 'Rental contracts per month' : 'Contratos de locação por mês'}: ${f.volume.value}`)
      ;(window.dataLayer = window.dataLayer || []).push({ event: 'whatsapp_clique', origem: 'cadastro-parceiro', servico: 'Parceiro imobiliário', pagina: location.pathname })
      if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { servico: 'Parceiro imobiliário' })
      window.open(`https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(linhas.join('\n'))}`, '_blank', 'noopener')
      janela.close()
    })
  }

  botao.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopImmediatePropagation()
    if (!vaga.firstElementChild) montar()
    janela.showModal()
    document.documentElement.style.overflow = 'hidden'
    janela.querySelector('input')?.focus()
  })
  janela.addEventListener('close', () => {
    document.documentElement.style.overflow = ''
    botao.focus({ preventScroll: true })
  })
  janela.querySelector('.parceiro__fechar').addEventListener('click', () => janela.close())
  // clique no fundo escuro fecha
  janela.addEventListener('click', (e) => e.target === janela && janela.close())
})()
