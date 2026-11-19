VÉRTICE — Probador virtual (UX actualizado)

Incluye:
- Carga independiente de fotografía de la persona y fotografía de la prenda.
- Arrastrar y soltar para ambas imágenes.
- Vista previa, reemplazo y eliminación de imágenes.
- Validación de formato JPG/PNG/WEBP y tamaño máximo de 10 MB.
- Catálogo opcional de prendas de ejemplo y filtros.
- Comparación previa de ambas imágenes y validación de requisitos.
- Diseño responsive actualizado para escritorio y móvil.

Cómo probar:
1. Descomprime el ZIP.
2. Abre index.html en el navegador.
3. Carga una foto de persona y una foto de prenda.
4. También puedes seleccionar una prenda de ejemplo del catálogo.

IMPORTANTE:
Esta actualización implementa la experiencia de carga y preparación de imágenes, no la generación real de ropa sobre la persona. El botón de prueba valida que ambas imágenes estén listas. Para generar el resultado real se debe integrar FASHN AI con un Cloudflare Worker y una API Key privada. No pongas la API Key en script.js ni en GitHub.


MEJORA VISUAL DETALLADA:
- Jerarquía visual y microdetalles en cabecera y hero.
- Indicador de pasos más visible.
- Paneles de carga con estados y consejos fotográficos.
- Nota informativa sobre privacidad y uso de imágenes.
- Catálogo con metadatos, estados hover y selección resaltada.
- Área de revisión ampliada y tarjetas de información.

TEMA ADAPTATIVO POR FOTOGRAFÍA:
- Al cargar la foto de la persona, el navegador analiza una pequeña muestra de píxeles localmente.
- Calcula un tono dominante y adapta los brillos, acentos, indicadores y fondos ambientales de la interfaz.
- No utiliza IA ni envía la fotografía a un servidor para esta función.
- El botón "Restaurar tema original" devuelve la apariencia violeta predeterminada.
