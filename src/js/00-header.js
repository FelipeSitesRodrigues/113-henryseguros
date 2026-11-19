// Menu do celular: tela cheia, fecha no link, no Esc (devolvendo o foco pro botão) e
// quando a tela passa pro tamanho de computador. Enquanto aberto, o resto da página
// fica inerte e sem rolagem, e o Tab gira entre o botão e os itens do menu. (base do 078 ao 080)
;(() => {
  const topo = document.getElementById('topo')
  const botao = topo?.querySelector('.topo__menu')
  const menu = document.getElementById('menu')
  if (!topo || !botao || !menu) return
  const fundo = [document.querySelector('main'), document.querySelector(".rodape"), document.querySelector('.zap-flutuante'), topo.querySelector('.marca')].filter(Boolean)
  const aberto = () => topo.classList.contains('topo--aberto')

  const abrir = (sim) => {
    topo.classList.toggle('topo--aberto', sim)
    botao.setAttribute('aria-expanded', String(sim))
    botao.setAttribute('aria-label', sim ? 'Fechar menu' : 'Abrir menu')
    document.documentElement.style.overflow = sim ? 'hidden' : ''
    fundo.forEach((el) => (el.inert = sim))
    if (sim) menu.querySelector('a')?.focus({ preventScroll: true })
  }

  botao.addEventListener('click', () => abrir(!aberto()))
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) abrir(false)
  })
  document.addEventListener('keydown', (e) => {
    if (!aberto()) return
    if (e.key === 'Escape') {
      abrir(false)
      botao.focus()
      return
    }
    if (e.key !== 'Tab') return
    const lista = [botao, ...menu.querySelectorAll('a[href], button')].filter((el) => el.offsetParent !== null)
    const i = lista.indexOf(document.activeElement)
    if (e.shiftKey && i <= 0) {
      e.preventDefault()
      lista[lista.length - 1].focus()
    } else if (!e.shiftKey && i === lista.length - 1) {
      e.preventDefault()
      lista[0].focus()
    }
  })
  matchMedia('(min-width: 64em)').addEventListener('change', (m) => m.matches && abrir(false))
})()

// Submenu "Soluções": abre no clique (e com mouse, ao passar por cima, com uma folga pra
// fechar), fecha no Esc, no clique fora e quando o foco sai dele. No celular vira sanfona.
;(() => {
  const sub = document.querySelector('.sub')
  const botao = sub?.querySelector('.sub__botao')
  if (!sub || !botao) return
  const mouse = matchMedia('(hover: hover) and (pointer: fine)')
  const largo = matchMedia('(min-width: 64em)')
  let espera = 0
  let abriuEm = 0
  const abrir = (sim) => {
    clearTimeout(espera)
    if (sim && !sub.classList.contains('sub--aberta')) abriuEm = Date.now()
    sub.classList.toggle('sub--aberta', sim)
    botao.setAttribute('aria-expanded', String(sim))
  }
  // o mouse que chega abre por cima; o clique logo em seguida não pode fechar de novo
  botao.addEventListener('click', () => abrir(!sub.classList.contains('sub--aberta') || Date.now() - abriuEm < 600))
  sub.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse' && mouse.matches && largo.matches) abrir(true)
  })
  sub.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && mouse.matches && largo.matches) espera = setTimeout(() => abrir(false), 220)
  })
  document.addEventListener('click', (e) => {
    if (largo.matches && !sub.contains(e.target)) abrir(false)
  })
  sub.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sub.classList.contains('sub--aberta')) {
      e.stopPropagation()
      abrir(false)
      botao.focus()
    }
  })
  sub.addEventListener('focusout', (e) => {
    if (largo.matches && !sub.contains(e.relatedTarget)) abrir(false)
  })
  largo.addEventListener('change', () => abrir(false))
})()

// Some ao descer, volta ao subir: só depois que o hero sai da tela. Um ouvinte de rolagem
// passivo que só compara a posição num quadro (rAF) e troca uma classe; nada de layout.
// Fica visível com o submenu aberto, com foco dentro do topo e perto do começo da página.
;(() => {
  const topo = document.getElementById('topo')
  const inicio = document.getElementById('inicio')
  if (!topo) return
  let ultimo = scrollY
  let pedido = 0
  const FOLGA = 8
  const conferir = () => {
    pedido = 0
    const y = scrollY
    const dif = y - ultimo
    if (Math.abs(dif) < FOLGA) return
    const passouHero = y > (inicio ? inicio.offsetTop + inicio.offsetHeight - 80 : 400)
    const preso = topo.classList.contains('topo--aberto') || topo.querySelector('.sub--aberta') || topo.contains(document.activeElement)
    topo.classList.toggle('topo--escondido', dif > 0 && passouHero && !preso)
    ultimo = y
  }
  addEventListener('scroll', () => pedido || (pedido = requestAnimationFrame(conferir)), { passive: true })
  // foco por teclado num link do topo escondido traz ele de volta
  topo.addEventListener('focusin', () => topo.classList.remove('topo--escondido'))
})()
