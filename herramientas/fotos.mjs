// Optimiza las fotos de un proyecto para la web.
// Uso: npm run fotos -- <carpeta-con-fotos> <slug-del-proyecto> [--retocar]
// Crea img/proyectos/<slug>/<nombre>.webp (1800 px) y <nombre>-800.webp (miniatura).
// Las fotos HEIC del iPhone se convierten antes a PNG en _originales/<slug>/.
// --retocar aplica un retoque suave: niveles automáticos, algo más de luz, color y nitidez.
import sharp from 'sharp';
import heicConvert from 'heic-convert';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const retocar = args.includes('--retocar');
let [origen, slug] = args.filter((a) => !a.startsWith('--'));
if (!origen || !slug) {
  console.error('Uso: npm run fotos -- <carpeta-con-fotos> <slug-del-proyecto> [--retocar]');
  process.exit(1);
}

const destino = path.join('img', 'proyectos', slug);
fs.mkdirSync(destino, { recursive: true });

// "Estudio Antes 1.JPG" -> "estudio-antes-1"
const limpiar = (nombre) => nombre
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ordenar = (a, b) => a.localeCompare(b, 'es', { numeric: true });

// HEIC -> PNG (sharp no lee HEIC)
const heics = fs.readdirSync(origen).filter((f) => /\.hei[cf]$/i.test(f)).sort(ordenar);
if (heics.length) {
  const carpetaPng = path.join('_originales', slug);
  fs.mkdirSync(carpetaPng, { recursive: true });
  for (const archivo of heics) {
    const png = path.join(carpetaPng, `${limpiar(path.parse(archivo).name)}.png`);
    if (fs.existsSync(png)) continue;
    const salida = await heicConvert({ buffer: fs.readFileSync(path.join(origen, archivo)), format: 'PNG' });
    fs.writeFileSync(png, Buffer.from(salida));
    console.log(`  ${archivo}  ->  ${png}`);
  }
  origen = carpetaPng;
}

const archivos = fs.readdirSync(origen)
  .filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f))
  .sort(ordenar);

if (!archivos.length) {
  console.error(`No hay fotos (jpg, png, webp, heic) en ${origen}`);
  process.exit(1);
}

const preparar = (entrada, lado) => {
  // .rotate() aplica la orientación EXIF del móvil antes de quitar los metadatos
  let img = sharp(entrada).rotate().resize({ width: lado, height: lado, fit: 'inside', withoutEnlargement: true });
  if (retocar) img = img.normalise({ lower: 1, upper: 99.5 }).modulate({ brightness: 1.03, saturation: 1.1 }).sharpen({ sigma: 0.8 });
  return img;
};

const nombres = [];
for (const archivo of archivos) {
  const nombre = limpiar(path.parse(archivo).name);
  const entrada = path.join(origen, archivo);
  await preparar(entrada, 1800).webp({ quality: 78 }).toFile(path.join(destino, `${nombre}.webp`));
  await preparar(entrada, 800).webp({ quality: 72 }).toFile(path.join(destino, `${nombre}-800.webp`));
  const kb = Math.round(fs.statSync(path.join(destino, `${nombre}.webp`)).size / 1024);
  console.log(`  ${archivo}  ->  ${nombre}.webp (${kb} KB)`);
  nombres.push(nombre);
}

console.log(`\n${nombres.length} fotos listas en ${destino}${retocar ? ' (retocadas)' : ''}`);
console.log('Nombres para datos/proyectos.json:');
console.log(JSON.stringify(nombres));
