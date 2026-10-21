// Menú del móvil
const botonMenu = document.querySelector('.menu-boton');
const menu = document.getElementById('menu');
botonMenu?.addEventListener('click', () => {
  const abierto = menu.classList.toggle('abierto');
  botonMenu.setAttribute('aria-expanded', abierto);
  botonMenu.innerHTML = abierto ? '<i class="bi bi-x-lg"></i>' : '<i class="bi bi-list"></i>';
});

// Aparición suave al hacer scroll
const aparecen = document.querySelectorAll('.aparece');
if ('IntersectionObserver' in window) {
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observador.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -60px 0px' });
  aparecen.forEach((el) => observador.observe(el));
} else {
  aparecen.forEach((el) => el.classList.add('visible'));
}

// Visor de fotos a pantalla completa
const enlaces = [...document.querySelectorAll('a[data-visor]')];
if (enlaces.length) {
  const visor = document.createElement('dialog');
  visor.className = 'visor';
  visor.innerHTML = `<img alt="">
    <button class="cerrar" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
    <button class="ant" aria-label="Foto anterior"><i class="bi bi-chevron-left"></i></button>
    <button class="sig" aria-label="Foto siguiente"><i class="bi bi-chevron-right"></i></button>`;
  document.body.append(visor);
  const img = visor.querySelector('img');
  let actual = 0;

  const mostrar = (i) => {
    actual = (i + enlaces.length) % enlaces.length;
    img.src = enlaces[actual].href;
    img.alt = enlaces[actual].querySelector('img')?.alt || '';
  };

  enlaces.forEach((a, i) => a.addEventListener('click', (e) => {
    e.preventDefault();
    mostrar(i);
    visor.showModal();
  }));
  visor.querySelector('.cerrar').onclick = () => visor.close();
  visor.querySelector('.ant').onclick = () => mostrar(actual - 1);
  visor.querySelector('.sig').onclick = () => mostrar(actual + 1);
  visor.addEventListener('click', (e) => { if (e.target === visor) visor.close(); });
  visor.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') mostrar(actual - 1);
    if (e.key === 'ArrowRight') mostrar(actual + 1);
  });

  // Deslizar con el dedo en el móvil
  let inicioX = null;
  visor.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX; }, { passive: true });
  visor.addEventListener('touchend', (e) => {
    if (inicioX === null) return;
    const dx = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
    inicioX = null;
  });
}
