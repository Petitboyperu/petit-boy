# PETIT BOY

Menú móvil con catálogo, búsqueda, categorías, carrito persistente, pedidos por WhatsApp y un formulario de cotización para tortas y eventos. Incluye 27 productos con imágenes ilustrativas, la trufa de Carrot Cake a S/ 2.50 y una categoría de empanadas lista para completar cuando haya datos reales.

## Publicar en GitHub Pages

1. Sube todo el contenido de esta carpeta a un repositorio de GitHub.
2. En el repositorio, abre **Settings → Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`.
4. Espera el enlace de Pages y colócalo en la biografía de Instagram.

La imagen para compartir (`og:image`) apunta a `https://petitboyperu.github.io/petit-boy/assets/logo.png`. Si cambias el nombre del repositorio o la cuenta, actualiza esa URL en `index.html`.

También puedes probarlo en tu computadora con `python -m http.server 8000` desde esta carpeta y abrir `http://localhost:8000/`. No abras `index.html` con `file://`: el navegador no podrá leer el catálogo JSON de esa manera.

## Editar el menú

Abre `/admin/` en la web publicada. Allí puedes cambiar productos, categorías, cupones y configuración. El panel guarda un borrador en ese navegador y permite descargar `store.json`. Para publicar los cambios a todos los clientes, reemplaza [`data/store.json`](data/store.json) en el repositorio y espera la actualización de GitHub Pages. El panel no tiene acceso de escritura al repositorio ni autenticación; por eso no modifica el sitio público directamente.

El número de WhatsApp está en `config.whatsappNumber`, dentro de `data/store.json`. Debe contener código de país y número, solo dígitos. Actualmente está configurado como `51967657766`.

## Tortas y eventos

La sección `#personalizados` permite solicitar una cotización para tortas temáticas, mesas dulces, bocaditos o postres individuales. El formulario crea un mensaje de WhatsApp con tipo de pedido, sabores, porciones, fecha, ocasión, nombre y notas. No calcula precios ni confirma pedidos automáticamente.

El mínimo de anticipación se configura con `config.customOrderLeadDays` en `data/store.json` y está fijado inicialmente en 3 días. La fecha del evento no puede ser anterior a ese mínimo. Los sabores marcados «a consultar» no figuran como productos confirmados en el menú; PETIT BOY debe validar su disponibilidad al cotizar.

La imagen de esta sección está en `assets/tortas-personalizadas.webp`. Para probar el flujo localmente con Playwright, ejecuta `python tests/smoke_custom_orders.py` mientras el servidor HTTP está activo en el puerto 8000.

Para añadir una empanada, crea un producto en `/admin/`, elige la categoría **Empanadas**, asigna nombre, precio y ruta de imagen, descarga el JSON y súbelo junto con la foto. No hay empanadas ficticias en el catálogo inicial.

Las imágenes generadas son ilustrativas y no representan necesariamente el aspecto exacto de los productos vendidos. Antes de publicar, confirma precios, descripciones, disponibilidad y que el número de WhatsApp recibe pedidos. Las fotos originales de PETIT BOY pueden reemplazar cada archivo de `assets/products/` o asignarse mediante la ruta `image` de cada producto.

El delivery aparece como **Por confirmar**; no se cobra ni se inventa una tarifa. La fecha y la hora son aproximadas porque no se proporcionaron horarios. Ningún pedido se considera confirmado hasta que PETIT BOY responda por WhatsApp.
