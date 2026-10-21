// Genera todas las páginas HTML de la web a partir de:
//   datos/sitio.json      -> datos de la empresa (teléfono, redes, opiniones...)
//   datos/proyectos.json  -> proyectos (el orden de la lista es el orden en la web)
//   contenido/*.html      -> textos de cada página
// Uso: npm run generar
import fs from 'node:fs';
import path from 'node:path';

const leerJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const sitio = leerJson('datos/sitio.json');
const proyectos = leerJson('datos/proyectos.json');

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const urlWhatsapp = (mensaje = sitio.mensajeWhatsapp) => `https://wa.me/${sitio.whatsapp}?text=${encodeURIComponent(mensaje)}`;
const urlTelefono = `tel:${sitio.telefono.replace(/\s/g, '')}`;
const anio = new Date().getFullYear();

// ---------- Comprobaciones: avisa de fotos que no existen ----------
const errores = [];
for (const p of proyectos) {
  p.pagina ||= `proyecto-${p.slug}.html`;
  const usadas = [p.portada, ...(p.galerias || []).flatMap((g) => g.fotos), ...(p.comparativas || []).flatMap((c) => [c.antes, c.despues])];
  for (const n of usadas) {
    if (!fs.existsSync(`img/proyectos/${p.slug}/${n}.webp`)) errores.push(`Proyecto "${p.slug}": falta la foto img/proyectos/${p.slug}/${n}.webp`);
  }
}
if (errores.length) { console.error(errores.join('\n')); process.exit(1); }

// ---------- Piezas ----------
const foto = (p, n, grande = true) => `img/proyectos/${p.slug}/${n}${grande ? '' : '-800'}.webp`;

// encuadre: qué parte de la foto se ve cuando se recorta (ej. "50% 70%" = centrada, más abajo)
const imagen = (p, n, alt, { sizes = '(max-width: 800px) 100vw, 50vw', lazy = true, encuadre } = {}) =>
  `<img src="${foto(p, n, false)}" srcset="${foto(p, n, false)} 800w, ${foto(p, n)} 1800w" sizes="${sizes}" alt="${esc(alt)}"${encuadre ? ` style="object-position: ${esc(encuadre)}"` : ''}${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}>`;

const tarjetaProyecto = (p) => `
      <a class="proyecto aparece" href="${p.pagina}">
        <figure>${imagen(p, p.portada, p.titulo, { sizes: '(max-width: 700px) 100vw, 380px', encuadre: p.encuadre })}</figure>
        <div class="cuerpo">
          <div class="etiquetas">${p.destacado ? '<span class="etiqueta etiqueta--destacado"><i class="bi bi-star-fill"></i> Destacado</span>' : ''}<span class="etiqueta">${esc(p.tipo)}</span><span class="etiqueta"><i class="bi bi-geo-alt"></i> ${esc(p.ubicacion)}</span></div>
          <h3>${esc(p.titulo)}</h3>
          <p>${esc(p.resumen)}</p>
          <span class="mas">Ver proyecto <i class="bi bi-arrow-right"></i></span>
        </div>
      </a>`;

const rejillaProyectos = (lista) => `<div class="rejilla rejilla--proyectos">${lista.map(tarjetaProyecto).join('')}\n    </div>`;

const bloqueOpiniones = () => {
  if (!sitio.opiniones?.length) return '';
  return `
  <section class="seccion">
    <div class="contenedor">
      <div class="centrado"><span class="antetitulo">Opiniones</span><h2>Lo que dicen nuestros clientes</h2></div>
      <div class="rejilla rejilla--3">${sitio.opiniones.map((o) => `
        <figure class="tarjeta opinion aparece">
          <div class="estrellas">${'<i class="bi bi-star-fill"></i>'.repeat(o.estrellas || 5)}</div>
          <blockquote>“${esc(o.texto)}”</blockquote>
          <figcaption><cite>${esc(o.nombre)}</cite>${o.lugar ? ` · ${esc(o.lugar)}` : ''}</figcaption>
        </figure>`).join('')}
      </div>
    </div>
  </section>`;
};

const datosTitular = () => {
  const filas = [
    ['Titular', sitio.titular], ['NIF', sitio.nif], ['Domicilio', sitio.domicilio],
    ['Correo electrónico', sitio.email], ['Teléfono', sitio.telefono],
  ].filter(([, v]) => v);
  return `<ul>${filas.map(([k, v]) => `<li><strong>${k}:</strong> ${esc(v)}</li>`).join('')}</ul>`;
};

// Valores que se pueden usar en contenido/*.html como {{nombre}}
const variables = {
  ...Object.fromEntries(Object.entries(sitio).filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, esc(v)])),
  whatsapp_url: urlWhatsapp(),
  telefono_url: urlTelefono,
  anio,
  zonas: esc(sitio.zonas.join(', ')),
  // En la portada salen los proyectos marcados con "destacado": true (si no hay, los 3 primeros)
  proyectos_destacados: rejillaProyectos(proyectos.some((p) => p.destacado) ? proyectos.filter((p) => p.destacado) : proyectos.slice(0, 3)),
  proyectos_todos: rejillaProyectos(proyectos),
  opiniones: bloqueOpiniones(),
  datos_titular: datosTitular(),
};

// ---------- Plantilla común ----------
const negocioJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  name: sitio.nombre,
  url: `${sitio.dominio}/`,
  logo: `${sitio.dominio}/img/logo-512.png`,
  image: `${sitio.dominio}/${foto(proyectos[0], proyectos[0].portada)}`,
  telephone: sitio.telefono,
  email: sitio.email,
  address: { '@type': 'PostalAddress', addressLocality: sitio.ciudad, addressRegion: sitio.provincia, addressCountry: 'ES' },
  areaServed: sitio.zonas,
  sameAs: [sitio.instagram, sitio.youtube],
};

const menu = [
  ['sobre-nosotros', 'sobre-nosotros.html', 'Sobre nosotros'],
  ['servicios', 'servicios.html', 'Servicios'],
  ['proyectos', 'proyectos.html', 'Proyectos'],
  ['contacto', 'contacto.html', 'Contacto'],
];

function pagina({ archivo, titulo, descripcion, cuerpo, menuActual, imagenOg, jsonLd = [], noindex = false, base = '' }) {
  const url = `${sitio.dominio}/${archivo === 'index.html' ? '' : archivo}`;
  const og = imagenOg || `${sitio.dominio}/${foto(proyectos[0], proyectos[0].portada)}`;
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${base ? `<base href="${base}">\n  ` : ''}<title>${esc(titulo)}</title>
  <meta name="description" content="${esc(descripcion)}">
  ${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(sitio.nombre)}">
  <meta property="og:locale" content="es_ES">
  <meta property="og:title" content="${esc(titulo)}">
  <meta property="og:description" content="${esc(descripcion)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${og}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#0D1B2A">
  <link rel="icon" type="image/png" sizes="32x32" href="img/favicon/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="img/favicon/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="img/favicon/apple-touch-icon.png">
  <link rel="manifest" href="img/favicon/site.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/estilos.css">
${jsonLd.map((j) => `  <script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body>

<header class="cabecera">
  <div class="contenedor">
    <a class="logo" href="index.html"><img src="img/logo.webp" alt="${esc(sitio.nombre)} — reformas integrales" width="74" height="58"></a>
    <button class="menu-boton" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu"><i class="bi bi-list"></i></button>
    <nav class="menu" id="menu">
${menu.map(([clave, href, texto]) => `      <a href="${href}"${clave === menuActual ? ' aria-current="page"' : ''}>${texto}</a>`).join('\n')}
      <a class="btn btn--dorado" href="contacto.html">Presupuesto gratis</a>
    </nav>
  </div>
</header>

<main>
${cuerpo}
</main>

<footer class="pie">
  <div class="contenedor">
    <div class="rejilla">
      <div>
        <img class="logo-pie" src="img/logo.webp" alt="${esc(sitio.nombre)}" width="81" height="64" loading="lazy">
        <p>Empresa familiar de reformas integrales y asesoramiento inmobiliario. Trabajamos desde ${esc(sitio.ciudad)} en toda la Costa Brava.</p>
      </div>
      <div>
        <h3>Contacto</h3>
        <ul>
          <li><a href="${urlTelefono}"><i class="bi bi-telephone"></i>${esc(sitio.telefono)}</a></li>
          <li><a href="${urlWhatsapp()}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i>WhatsApp</a></li>
          <li><a href="mailto:${sitio.email}"><i class="bi bi-envelope"></i>${esc(sitio.email)}</a></li>
          <li><i class="bi bi-geo-alt"></i>${esc(sitio.zonas.join(' · '))}</li>
        </ul>
      </div>
      <div>
        <h3>Síguenos</h3>
        <ul>
          <li><a href="${sitio.instagram}" target="_blank" rel="noopener"><i class="bi bi-instagram"></i>Instagram</a></li>
          <li><a href="${sitio.youtube}" target="_blank" rel="noopener"><i class="bi bi-youtube"></i>YouTube</a></li>
        </ul>
      </div>
    </div>
    <div class="legales">
      <span>© ${anio} ${esc(sitio.nombre)}. Todos los derechos reservados.</span>
      <span><a href="aviso-legal.html">Aviso legal</a> · <a href="privacidad.html">Privacidad</a> · <a href="cookies.html">Cookies</a> · <a href="terminos-y-condiciones.html">Términos</a></span>
    </div>
  </div>
</footer>

<a class="wa-flotante" href="${urlWhatsapp()}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp"><i class="bi bi-whatsapp"></i></a>
<script src="js/web.js" defer></script>
</body>
</html>
`;
}

// ---------- Páginas de contenido ----------
const generadas = [];
const escribir = (archivo, html, enMapa = true) => {
  fs.writeFileSync(archivo, html);
  if (enMapa) generadas.push(archivo);
};

for (const fichero of fs.readdirSync('contenido').filter((f) => f.endsWith('.html'))) {
  const bruto = fs.readFileSync(path.join('contenido', fichero), 'utf8');
  const cabecera = bruto.match(/^<!--([\s\S]*?)-->/);
  if (!cabecera) throw new Error(`contenido/${fichero}: falta la cabecera <!-- titulo: ... -->`);
  const meta = Object.fromEntries(cabecera[1].trim().split('\n').map((l) => {
    const i = l.indexOf(':');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }));
  const cuerpo = bruto.slice(cabecera[0].length).replace(/\{\{(\w+)\}\}/g, (_, clave) => {
    if (!(clave in variables)) throw new Error(`contenido/${fichero}: no existe la variable {{${clave}}}`);
    return variables[clave];
  });
  const noindex = meta.indexar === 'no';
  escribir(fichero, pagina({
    archivo: fichero,
    titulo: meta.titulo,
    descripcion: meta.descripcion,
    menuActual: meta.menu,
    cuerpo,
    noindex,
    base: fichero === '404.html' ? '/' : '',
    jsonLd: ['index.html', 'contacto.html'].includes(fichero) ? [negocioJsonLd] : [],
  }), !noindex);
}

// ---------- Páginas de proyectos ----------
proyectos.forEach((p, i) => {
  const anterior = proyectos[i - 1];
  const siguiente = proyectos[i + 1];
  const mensaje = `Hola, he visto el proyecto "${p.titulo}" en vuestra web y me gustaría pedir presupuesto para algo parecido.`;

  const comparativas = (p.comparativas || []).length ? `
      <h2>Antes y después</h2>
      ${p.comparativas.map((c) => `
      <h3>${esc(c.titulo)}</h3>
      <div class="comparativa">
        <figure><a href="${foto(p, c.antes)}" data-visor>${imagen(p, c.antes, `${c.titulo} antes de la reforma`)}</a><figcaption>Antes</figcaption></figure>
        <figure><a href="${foto(p, c.despues)}" data-visor>${imagen(p, c.despues, `${c.titulo} después de la reforma`)}</a><figcaption>Después</figcaption></figure>
      </div>`).join('')}` : '';

  const galerias = (p.galerias || []).map((g) => `
      <h2>${esc(g.titulo)}</h2>
      <div class="galeria">${g.fotos.map((n) => `
        <a href="${foto(p, n)}" data-visor>${imagen(p, n, `${p.titulo} — ${g.titulo}`, { sizes: '(max-width: 600px) 100vw, 300px' })}</a>`).join('')}
      </div>`).join('');

  const cuerpo = `
  <section class="hero" style="min-height: 60vh">
    ${imagen(p, p.portada, p.titulo, { sizes: '100vw', lazy: false, encuadre: p.encuadre })}
    <div class="contenedor">
      <span class="antetitulo">${esc(p.tipo)} · ${esc(p.ubicacion)}</span>
      <h1>${esc(p.titulo)}</h1>
      <p class="lead">${esc(p.resumen)}</p>
    </div>
  </section>

  <section class="seccion">
    <div class="contenedor detalle">
      <div>
        <h2>Detalles del proyecto</h2>
        <p>${esc(p.descripcion)}</p>
        <ul class="lista-check">${p.trabajos.map((t) => `\n          <li>${esc(t)}</li>`).join('')}
        </ul>
        <p>${esc(p.conclusion)}</p>
        ${comparativas}
        ${galerias}
        <nav class="navegacion-proyectos" aria-label="Otros proyectos">
          ${anterior ? `<a href="${anterior.pagina}"><i class="bi bi-arrow-left"></i> ${esc(anterior.titulo)}</a>` : '<span></span>'}
          ${siguiente ? `<a href="${siguiente.pagina}">${esc(siguiente.titulo)} <i class="bi bi-arrow-right"></i></a>` : '<a href="proyectos.html">Ver todos los proyectos <i class="bi bi-arrow-right"></i></a>'}
        </nav>
      </div>
      <aside class="ficha">
        <h3>¿Te gustaría una reforma como esta?</h3>
        <dl>
          <dt>Ubicación</dt><dd>${esc(p.ubicacion)}</dd>
          <dt>Tipo</dt><dd>${esc(p.tipo)}</dd>
        </dl>
        <p>Cuéntanos tu idea y te asesoramos sin compromiso.</p>
        <a class="btn btn--whatsapp" href="${urlWhatsapp(mensaje)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Pedir presupuesto por WhatsApp</a>
        <a class="btn btn--dorado" href="contacto.html">Enviar un mensaje</a>
      </aside>
    </div>
  </section>`;

  escribir(p.pagina, pagina({
    archivo: p.pagina,
    titulo: `${p.titulo} | ${sitio.nombre}`,
    descripcion: p.resumen,
    menuActual: 'proyectos',
    imagenOg: `${sitio.dominio}/${foto(p, p.portada)}`,
    cuerpo,
  }));
});

// ---------- Mapa del sitio ----------
const urls = generadas.map((f) => `  <url><loc>${sitio.dominio}/${f === 'index.html' ? '' : f}</loc></url>`);
fs.writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

console.log(`Listo: ${generadas.length} páginas en el mapa del sitio, ${proyectos.length} proyectos.`);
