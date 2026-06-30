# Proposal: Importación Masiva de Productos desde XLSX

## Intent

Eliminar la edición uno por uno de los productos. El usuario descarga un Excel, lo edita (precios, costo, stock, borra/agrega filas), lo sube y todo se actualiza en un paso.

## Scope

**In:** Backend `ImportProductsView` en `exports.py`, endpoints `POST /import/products/` y `GET /import/products/template/`, matching por ID→barcode→nombre+categoría→crear, creación auto de categorías, reporte de resultados, función frontend `importProducts()`, botón en SettingsPage + modal confirmación.

**Out:** Imágenes, importación de otras entidades, eliminación masiva, edición inline, i18n.

## Capabilities

**New:** `product-import` — import masivo con matching y reporte.
**Modified:** `data-export` — se agrega endpoint de template XLSX.

## Approach

1. `ImportProductsView(APIView)` con `post()` recibe `request.FILES['file']`, lee con `openpyxl`, itera filas
2. Matching: buscar por ID → barcode → (nombre + categoría) → crear si no existe
3. Categorías nuevas: `Category.objects.get_or_create(name=...)`
4. Errores por fila se acumulan, sin rollback total
5. Frontend: file input oculto → modal confirmación → POST FormData → toast con resumen
6. Template incluye columna Descripción

| Decisión | Opción | Por qué |
|---|---|---|
| Matching | ID→barcode→nombre+cat→crear | Precisión con datos existentes |
| Categorías | Crear automáticas | Sin precarga forzada |
| Errores | Continuar y reportar | No pierde todo por una fila |
| Ubicación | Botón junto a export | Flujo natural export→edit→import |
| Barcode dup | Error en esa fila | Unicidad sin bloquear batch |
| Descripción | Incluir en template | Modelo lo soporta, útil |
| Imagen | No va en XLSX | Campo binario |

## Affected Areas

| Área | Impacto |
|---|---|
| `coreApp/views/exports.py` | +ImportProductsView + template |
| `coreApp/views/__init__.py` | Exportar nueva view |
| `coreApp/urls.py` | 2 rutas nuevas |
| `frontend/src/api/settings.api.ts` | +importProducts(), +downloadTemplate() |
| `frontend/src/pages/SettingsPage.tsx` | Botón + modal + file input |

## Risks

| Riesgo | Prob. | Mitigación |
|---|---|---|
| XLSX mal formado | Media | Validar headers al inicio |
| Archivo >1000 productos | Baja | openpyxl iterador, sin cargar todo |
| Matching por nombre crea duplicados | Baja | Prioriza ID y barcode; match incluye categoría |

## Rollback

Revertir los 5 archivos. Cambio puramente aditivo. Datos erróneos se corrigen re-importando (filas con ID actualizan).

## Dependencies

- `openpyxl` ya instalado

## Success Criteria

- [ ] `POST /import/products/` procesa XLSX válido y reporta resultados
- [ ] Matching ID, barcode, nombre+categoría funciona
- [ ] Categorías nuevas se crean automáticamente
- [ ] `GET /import/products/template/` descarga plantilla válida
- [ ] Botón + modal en SettingsPage funcionan
- [ ] `python manage.py check` y `tsc --noEmit` pasan
