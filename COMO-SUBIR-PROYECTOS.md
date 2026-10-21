# Cómo añadir un proyecto nuevo

La web se genera sola a partir de dos archivos de datos. Nunca hace falta tocar el HTML a mano.

| Qué quieres cambiar | Dónde |
|---|---|
| Proyectos (textos, fotos, orden) | `datos/proyectos.json` |
| Teléfono, email, redes, zonas, opiniones de clientes, datos legales | `datos/sitio.json` |
| Textos de las páginas (servicios, sobre nosotros...) | `contenido/*.html` |
| Colores y diseño | `css/estilos.css` |

## Lo que tienes que pasarle a Claude

1. **Las fotos** en una carpeta (JPG o PNG, tal cual salen del móvil; Claude las optimiza).
   Si hay antes/después, ponles nombre: `cocina-antes.jpg`, `cocina-despues.jpg`.
   Si son del iPhone en formato HEIC, pásalas antes a JPG (o configura la cámara en "Más compatible").
2. **La información**, copiando esta plantilla:

```
Título: Reforma de cocina en Roses
Ubicación: Roses
Tipo: Reforma parcial            (o integral, exterior, baño...)
Resumen (1 frase para la tarjeta):
Descripción:
Trabajos realizados:
- ...
- ...
Resultado final (1-2 frases):
Foto de portada: (nombre de la foto)
```

## Lo que hace Claude (o tú, si quieres)

```bash
npm install                                              # solo la primera vez
npm run fotos -- "C:\ruta\a\las\fotos" reforma-cocina-roses   # optimiza las fotos
# añadir el proyecto AL PRINCIPIO de datos/proyectos.json
npm run generar                                          # crea/actualiza todas las páginas
npm run ver                                              # vista previa en http://localhost:4321
git add -A && git commit -m "Nuevo proyecto: ..." && git push   # publicar
```

`npm run generar` avisa si falta alguna foto o hay un error en los textos, así que no se puede publicar una página rota sin darse cuenta.

Los proyectos salen en la web en el mismo orden que en la lista. Los que llevan `"destacado": true` aparecen en la portada y con una etiqueta dorada "Destacado" (ahora: estudio, baño y casa con piscina).

## Opiniones de clientes

En `datos/sitio.json`, dentro de `"opiniones"`:

```json
"opiniones": [
  { "nombre": "María G.", "lugar": "Roses", "texto": "Nos reformaron la cocina en dos semanas...", "estrellas": 5 }
]
```

Cuando hay al menos una, aparece automáticamente una sección de opiniones en la portada.
