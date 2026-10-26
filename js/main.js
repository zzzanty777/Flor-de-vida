/* Espacios Flor de Vida - JS principal (sin dependencias). Animaciones solo si el usuario no pide reducir movimiento. */
(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  root.classList.add('js-ok');
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var reduce = mq.matches;
  var io = 'IntersectionObserver' in window;

  /* Cabecera: transparente sobre el hero, marino tras 40 px; se oculta al bajar y reaparece al subir */
  var cab = $('.cab');
  var hero = $('.hero, .cab-pag');
  if (cab) {
    var ultimo = window.scrollY, tick = false;
    var act = function () {
      var y = window.scrollY;
      if (hero) cab.classList.toggle('cab--sobre-foto', y < 40);
      if (!reduce && !document.body.classList.contains('sin-scroll')) {
        if (y > ultimo + 6 && y > 200) cab.classList.add('cab--oculta');
        else if (y < ultimo - 6 || y < 200) cab.classList.remove('cab--oculta');
      }
      ultimo = y; tick = false;
    };
    act();
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(act); } }, { passive: true });
    /* si un enlace interno o el teclado dan foco a la cabecera, que se vea */
    cab.addEventListener('focusin', function () { cab.classList.remove('cab--oculta'); });
  }

  /* Menu movil */
  var btn = $('.menu-boton'), panel = $('#panel');
  if (btn && panel) {
    var fuera = $$('main, footer, .barra, .salto');
    $$('.panel__enlaces a, .panel > .btn, .panel .contacto-rapido', panel).forEach(function (el, i) { el.style.setProperty('--k', i); });
    var estado = function (ab) {
      panel.classList.toggle('abierto', ab);
      btn.setAttribute('aria-expanded', ab); btn.setAttribute('aria-label', ab ? 'Cerrar menú' : 'Abrir menú');
      document.body.classList.toggle('sin-scroll', ab);
      if (ab && cab) cab.classList.remove('cab--oculta');
      fuera.forEach(function (el) { if (ab) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
    };
    var cerrar = function () { estado(false); };
    btn.addEventListener('click', function () {
      var ab = !panel.classList.contains('abierto');
      estado(ab);
      if (ab) { var primero = $('a', panel); if (primero) primero.focus(); }
    });
    if (window.matchMedia) matchMedia('(min-width:1024px)').addEventListener('change', function (m) { if (m.matches) cerrar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('abierto')) { cerrar(); btn.focus(); } });
    $$('a', panel).forEach(function (a) { a.addEventListener('click', cerrar); });
  }

  /* Barra inferior movil: aparece tras el hero */
  var barra = $('.barra');
  if (barra) {
    var mostrar = function () { barra.classList.toggle('visible', window.scrollY > window.innerHeight * 0.6); };
    mostrar(); window.addEventListener('scroll', mostrar, { passive: true });
  }

  /* Entradas al hacer scroll: una sola vez; el retraso se calcula por hermanos dentro de la seccion */
  var objetivos = $$('.rv, .rvf, .dibuja, .dibuja-x');
  var entrar = function (el) { el.classList.add('in'); };
  if (io && !reduce) {
    var secciones = $$('section, footer, .cierre, .qr');
    var porSeccion = new Map();
    objetivos.forEach(function (el) {
      var s = el.closest('section') || document.body;
      if (!porSeccion.has(s)) porSeccion.set(s, []);
      porSeccion.get(s).push(el);
    });
    porSeccion.forEach(function (lista) {
      lista.forEach(function (el, i) { el.style.setProperty('--d', Math.min(i, 4) * 80 + 'ms'); });
    });
    $$('.dibuja').forEach(function (g) { $$('circle, path', g).forEach(function (c, i) { c.setAttribute('pathLength', '1'); c.style.setProperty('--k', i); }); });
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { entrar(e.target); obs.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    objetivos.forEach(function (el) { obs.observe(el); });
  } else { objetivos.forEach(entrar); }

  /* Cifras que cuentan hasta su valor (el valor final ya esta escrito en el HTML) */
  var cifras = $$('[data-cuenta]');
  if (cifras.length && io && !reduce) {
    var cuenta = function (el) {
      var fin = parseInt(el.getAttribute('data-cuenta'), 10), t0 = null, dur = 1400;
      el.textContent = '0';
      requestAnimationFrame(function paso(t) {
        if (t0 === null) t0 = t;
        var f = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - f, 3);
        el.textContent = Math.round(fin * e);
        if (f < 1) requestAnimationFrame(paso); else el.textContent = fin;
      });
    };
    var oc = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        oc.unobserve(e.target);
        var li = e.target.closest('.cifra'); if (li) li.classList.add('in');
        cuenta(e.target);
      });
    }, { threshold: 0.6 });
    cifras.forEach(function (el) { oc.observe(el); });
  }

  /* Proyectos apilados: el panel que queda detras se reduce un poco (solo escritorio y con movimiento) */
  var apilado = $('.apilado');
  if (apilado && !reduce && window.matchMedia) {
    var paneles = $$('.proy', apilado), mqD = matchMedia('(min-width:1024px)'), tk2 = false;
    var escala = function () {
      tk2 = false;
      paneles.forEach(function (p, i) {
        var foto = $('.proy__foto', p);
        if (!mqD.matches || i === paneles.length - 1) { p.style.scale = ''; p.style.top = ''; return; }
        p.style.top = (72 + 12 + i * 16) + 'px';
        var sig = paneles[i + 1].getBoundingClientRect().top, mio = p.getBoundingClientRect();
        var prog = Math.max(0, Math.min(1, (mio.bottom - sig) / mio.height));
        p.style.scale = String(1 - 0.04 * prog);
        p.style.transformOrigin = '50% 0';
      });
      paneles[paneles.length - 1].style.top = (72 + 12 + (paneles.length - 1) * 16) + 'px';
    };
    var pedir = function () { if (!tk2) { tk2 = true; requestAnimationFrame(escala); } };
    paneles.forEach(function (p) { p.style.position = ''; });
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    escala();
    if (mqD.matches) apilado.classList.add('apilado--sticky');
    mqD.addEventListener('change', function () { apilado.classList.toggle('apilado--sticky', mqD.matches); escala(); });
  }

  /* Antes / despues */
  $$('[data-ba]').forEach(function (ba) {
    var tabs = $$('.ba__tab', ba), panels = $$('.ba__panel', ba);
    function selecciona(i) {
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach(function (p, k) { p.hidden = k !== i; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selecciona(i); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        if (n !== null) { e.preventDefault(); selecciona(n); tabs[n].focus(); }
      });
    });
    if (tabs.length) selecciona(0);
    panels.forEach(function (p) {
      var st = $('.ba__stage', p), asa = $('.ba__asa', p);
      if (!st || !asa) return;
      var pos = 50, arr = false;
      function set(v) { pos = Math.max(0, Math.min(100, v)); st.style.setProperty('--pos', pos + '%'); asa.setAttribute('aria-valuenow', Math.round(pos)); asa.setAttribute('aria-valuetext', texto(Math.round(pos))); }
      function texto(n) { return n <= 2 ? 'Mostrando solo la foto de después' : n >= 98 ? 'Mostrando solo la foto de antes' : 'Antes ' + n + '%, después ' + (100 - n) + '%'; }
      function desde(e) { var r = st.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
      function suelta() { arr = false; st.classList.remove('arrastrando'); }
      $$('img', st).forEach(function (im) { im.draggable = false; im.addEventListener('dragstart', function (e) { e.preventDefault(); }); });
      st.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') { if (e.button !== 0) return; e.preventDefault(); asa.focus({ preventScroll: true }); } else if (!(e.target.closest && e.target.closest('.ba__asa'))) return; arr = true; st.classList.add('arrastrando'); try { st.setPointerCapture(e.pointerId); } catch (x) {} desde(e); });
      st.addEventListener('pointermove', function (e) { if (arr) desde(e); });
      st.addEventListener('pointerup', suelta);
      st.addEventListener('pointercancel', suelta);
      asa.addEventListener('keydown', function (e) {
        var k = e.key, h = true;
        if (k === 'ArrowRight' || k === 'ArrowUp') set(pos + 5);
        else if (k === 'ArrowLeft' || k === 'ArrowDown') set(pos - 5);
        else if (k === 'Home') set(0);
        else if (k === 'End') set(100);
        else h = false;
        if (h) e.preventDefault();
      });
      set(50);
      if (!reduce && io) {
        var o = new IntersectionObserver(function (es) {
          if (!es[0].isIntersecting) return;
          o.disconnect();
          var t0 = null;
          requestAnimationFrame(function paso(t) {
            if (arr) return;
            if (t0 === null) t0 = t;
            var f = Math.min((t - t0) / 800, 1);
            set(50 - 15 * Math.sin(f * Math.PI));
            if (f < 1) requestAnimationFrame(paso);
          });
        }, { threshold: 0.6 });
        o.observe(st);
      }
    });
  });

  /* Filtro de proyectos */
  var filtros = $$('.filtro');
  if (filtros.length) {
    var items = $$('.proy[data-tipo]');
    filtros.forEach(function (f) {
      f.addEventListener('click', function () {
        filtros.forEach(function (x) { x.setAttribute('aria-pressed', x === f); });
        var t = f.dataset.filtro;
        items.forEach(function (it) { it.hidden = !(t === 'todos' || it.dataset.tipo === t); });
      });
    });
  }

  /* Visor de fotos */
  var enlaces = $$('a[data-visor]');
  if (enlaces.length && window.HTMLDialogElement) {
    var v = document.createElement('dialog'); v.className = 'visor'; v.setAttribute('aria-label', 'Galería de fotos');
    v.innerHTML = '<img alt="">' +
      '<button type="button" class="cerrar" aria-label="Cerrar"><svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<button type="button" class="ant" aria-label="Foto anterior"><svg class="i" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button type="button" class="sig-f" aria-label="Foto siguiente"><svg class="i" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>';
    document.body.appendChild(v);
    var im = $('img', v), cur = 0, origen = null;
    var show = function (i) { cur = (i + enlaces.length) % enlaces.length; im.src = enlaces[cur].href; im.alt = (enlaces[cur].querySelector('img') || {}).alt || ''; };
    enlaces.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); origen = a; show(i); v.showModal(); }); });
    $('.cerrar', v).onclick = function () { v.close(); };
    $('.ant', v).onclick = function () { show(cur - 1); };
    $('.sig-f', v).onclick = function () { show(cur + 1); };
    v.addEventListener('close', function () { if (origen) origen.focus(); });
    v.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
    var x0 = null;
    v.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    v.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
  }

  /* Formulario: validacion con mensajes visibles y tipo preseleccionado */
  var form = $('form[data-form]');
  if (form) {
    var q = new URLSearchParams(location.search).get('tipo');
    var sel = $('select[name=tipo]', form);
    if (q && sel) { $$('option', sel).forEach(function (o) { if (o.dataset.clave === q) sel.value = o.value; }); }
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      var ok = true;
      $$('[required]', form).forEach(function (c) {
        var err = document.getElementById(c.id + '-error');
        var mal = c.type === 'checkbox' ? !c.checked : !c.value.trim();
        c.setAttribute('aria-invalid', mal);
        if (err) err.classList.toggle('ver', mal);
        if (mal && ok) c.focus();
        if (mal) ok = false;
      });
      if (!ok) e.preventDefault();
    });
  }
})();
