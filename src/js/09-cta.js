// Formulário da chamada final: entra do <template> quando a seção chega perto (no HTML ele fazia
// o autofill forçar layout no carregamento, memória do 081) e, no envio, monta a mensagem e abre
// o WhatsApp da Henry numa aba nova. Sem JS fica o botão do WhatsApp.
;(() => {
  const vaga = document.querySelector('[data-form-vaga]')
  const molde = document.getElementById('form-cotacao')
  if (!vaga || !molde) return

  const montar = () => {
    vaga.replaceChildren(molde.content.cloneNode(true))
    const form = vaga.querySelector('form')
    const erro = form.querySelector('.form__erro')
    // o botão chegou depois do _base.js: a volta de luz da borda liga aqui
    const brilho = form.querySelector('[data-brilho]')
    if (brilho && !matchMedia('(prefers-reduced-motion: reduce)').matches) new IntersectionObserver(([e]) => brilho.classList.toggle('brilho-vivo', e.isIntersecting)).observe(brilho)
    const tel = form.elements.whatsapp
    // máscara simples do telefone: (11) 99999-9999
    tel.addEventListener('input', () => {
      const d = tel.value.replace(/\D/g, '').slice(0, 11)
      tel.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d
    })
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const f = form.elements
      const falta = []
      if (!f.nome.value.trim()) falta.push('seu nome')
      if (f.whatsapp.value.replace(/\D/g, '').length < 10) falta.push('um WhatsApp com DDD')
      if (!f.tipo.value) falta.push('o tipo de seguro')
      if (!f.aceite.checked) falta.push('o aceite da Política de Privacidade')
      if (falta.length) {
        erro.textContent = `Falta ${falta.join(', ').replace(/, ([^,]*)$/, ' e $1')}.`
        erro.hidden = false
        ;(!f.nome.value.trim() ? f.nome : f.whatsapp.value.replace(/\D/g, '').length < 10 ? f.whatsapp : !f.tipo.value ? f.tipo : f.aceite).focus()
        return
      }
      erro.hidden = true
      const linhas = [`Olá! Vim pelo site da Henry e gostaria de uma cotação de *${f.tipo.value}*.`, `Nome: ${f.nome.value.trim()}`, `WhatsApp: ${f.whatsapp.value}`]
      if (f.detalhes.value.trim()) linhas.push(`O que quero proteger: ${f.detalhes.value.trim()}`)
      ;(window.dataLayer = window.dataLayer || []).push({ event: 'whatsapp_clique', origem: 'formulario', servico: f.tipo.value, pagina: location.pathname })
      if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { servico: f.tipo.value })
      window.open(`https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(linhas.join('\n'))}`, '_blank', 'noopener')
    })
  }

  if (!('IntersectionObserver' in window)) return montar()
  const io = new IntersectionObserver(
    (entradas) => {
      if (!entradas.some((e) => e.isIntersecting)) return
      io.disconnect()
      montar()
    },
    { rootMargin: '900px 0px' },
  )
  io.observe(vaga)
})()
