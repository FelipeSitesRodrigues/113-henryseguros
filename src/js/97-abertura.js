// abertura: some do layout quando termina de subir, pra não ficar uma camada fixa por cima
;(() => {
  const a = document.querySelector('[data-abertura]')
  if (!a || !document.documentElement.classList.contains('abre')) return
  const fim = () => a.classList.add('acabou')
  a.addEventListener('animationend', (e) => e.target === a && fim())
  setTimeout(fim, 2300)
})()
