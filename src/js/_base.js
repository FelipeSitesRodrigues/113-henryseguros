// Henry Seguros: comportamento comum a todas as páginas. Sem biblioteca e sem ouvir o scroll:
// o que depende de rolagem vai por IntersectionObserver. Kit /animacoes-site junto (revelação,
// contador e borda que brilha). Cada seção com comportamento próprio tem o seu arquivo.
;(() => {
  const temIO = 'IntersectionObserver' in window
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches
  const mouse = matchMedia('(hover: hover) and (pointer: fine)').matches

  // ---------------------------------------------------------------- revelação no scroll
  const alvos = document.querySelectorAll('[data-revela]')
  if (!temIO) alvos.forEach((el) => el.classList.add('visivel'))
  else {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue
          e.target.classList.add('visivel')
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    alvos.forEach((el) => io.observe(el))
  }

  // ---------------------------------------------------------------- borda que brilha
  const brilhos = document.querySelectorAll('[data-brilho]')
  if (temIO && !reduzir) {
    const io = new IntersectionObserver((entradas) => entradas.forEach((e) => e.target.classList.toggle('brilho-vivo', e.isIntersecting)))
    brilhos.forEach((el) => io.observe(el))
  }
  if (mouse) {
    for (const el of brilhos) {
      let raf = 0
      let px = 0
      let py = 0
      const aplicar = () => {
        raf = 0
        const caixa = el.getBoundingClientRect()
        el.style.setProperty('--bx', `${(px - caixa.left).toFixed(1)}px`)
        el.style.setProperty('--by', `${(py - caixa.top).toFixed(1)}px`)
      }
      el.addEventListener('pointerenter', (e) => {
        px = e.clientX
        py = e.clientY
        aplicar()
        el.classList.add('brilho-mouse')
      })
      el.addEventListener('pointermove', (e) => {
        px = e.clientX
        py = e.clientY
        if (!raf) raf = requestAnimationFrame(aplicar)
      })
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf)
        raf = 0
        el.classList.remove('brilho-mouse')
      })
    }
  }

  // ---------------------------------------------------------------- topo e botão flutuante
  // O topo ganha fundo de vidro escuro quando a página sai do começo (sentinela a 40 px). O
  // WhatsApp flutuante aparece depois que os botões do topo saem da tela e some no fim (o
  // convite final já leva pro WhatsApp, e o rodapé tem o número).
  const topo = document.getElementById('topo')
  const inicio = document.getElementById('inicio')
  const zap = document.querySelector('.zap-flutuante')
  const botoesTopo = inicio?.querySelector('[data-zap-depois]')
  const fim = document.querySelector('[data-zap-some]') || document.getElementById('rodape')
  if (temIO && inicio) {
    const sentinela = document.createElement('div')
    sentinela.setAttribute('aria-hidden', 'true')
    sentinela.style.cssText = 'position:absolute;top:40px;left:0;width:1px;height:1px;pointer-events:none'
    inicio.prepend(sentinela)
    new IntersectionObserver(([e]) => topo?.classList.toggle('topo--rolado', !e.isIntersecting)).observe(sentinela)
    let botoesFora = false
    let noFim = false
    const zapVisivel = () => zap?.classList.toggle('visivel', botoesFora && !noFim)
    new IntersectionObserver(([e]) => {
      botoesFora = !e.isIntersecting && e.boundingClientRect.top < 0
      zapVisivel()
    }).observe(botoesTopo || inicio)
    if (fim)
      new IntersectionObserver(
        ([e]) => {
          noFim = e.isIntersecting || e.boundingClientRect.top < 0
          zapVisivel()
        },
        { rootMargin: '0px 0px -35% 0px' },
      ).observe(fim)
  } else zap?.classList.add('visivel')

  // ---------------------------------------------------------------- âncoras
  // As seções abaixo do topo usam content-visibility (99-desempenho.css) e, até aparecerem,
  // têm altura estimada: a rolagem até uma âncora distante parava no lugar errado. No primeiro
  // clique numa âncora (ou chegando com #algo de outra página) a página desenha tudo uma vez e
  // só então rola; no fim da rolagem, confere e acerta (bug do 076). Base do 080.
  const desenharTudo = () => document.documentElement.classList.add('cv-pronto')
  const folga = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
  const alvoDe = (hash) => {
    try {
      return hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
    } catch {
      return null
    }
  }
  const chegada = alvoDe(location.hash)
  if (chegada) {
    desenharTudo()
    const conferir = () =>
      requestAnimationFrame(() => {
        const dif = chegada.getBoundingClientRect().top - folga()
        if (Math.abs(dif) > 3) scrollBy({ top: dif, behavior: 'instant' })
      })
    if (document.readyState === 'complete') conferir()
    else addEventListener('load', conferir, { once: true })
  }
  let pendente = null
  const acertar = () => {
    if (!pendente || Date.now() > pendente.ate) return (pendente = null)
    const alvo = pendente.alvo
    pendente = null
    const dif = alvo.getBoundingClientRect().top - folga()
    if (Math.abs(dif) > 3) scrollBy({ top: dif, behavior: 'instant' })
  }
  if ('onscrollend' in window) addEventListener('scrollend', acertar)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]')
    if (!a || e.defaultPrevented) return
    const destino = new URL(a.href, location.href)
    if (destino.origin !== location.origin || destino.pathname !== location.pathname) return
    const alvo = alvoDe(destino.hash)
    if (!alvo) return
    const id = alvo.id
    e.preventDefault()
    desenharTudo()
    requestAnimationFrame(() => {
      pendente = { alvo, ate: Date.now() + 4000 }
      alvo.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'start' })
      if (!('onscrollend' in window)) setTimeout(acertar, 1400)
      history.pushState(null, '', '#' + id)
      if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1')
      alvo.focus({ preventScroll: true })
    })
  })

  // ---------------------------------------------------------------- rastreio dos cliques no WhatsApp
  // Vai pro dataLayer (GA4 / Tag Manager) e pro Pixel, se um dia forem instalados.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="https://wa.me/"]')
    if (!a) return
    const origem = a.dataset.zap || a.closest('section, header, footer')?.id || 'pagina'
    const servico = a.dataset.servico
    ;(window.dataLayer = window.dataLayer || []).push({ event: 'whatsapp_clique', origem, servico, pagina: location.pathname })
    if (typeof window.fbq === 'function') window.fbq('track', 'Contact', { origem, servico })
  })
})()
