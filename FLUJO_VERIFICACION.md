# ✅ Verificación de Flujo Completo — FiadoApp

> Checklist manual para probar que todo el sistema funciona de punta a punta como una tienda real.
> Marcá con ✔ cada paso que funcione correctamente.

---

## 1. Login y Configuración

- [ ] **Login**: Iniciá sesión con usuario/contraseña → Dashboard
- [ ] **Nombre tienda**: Andá a Ajustes → cambiá el nombre → verificá que se actualice en Sidebar, y al recargar se mantenga
- [ ] **Logout**: Cerrá sesión → volvé al login → el nombre de tienda actualizado se ve en la pantalla de login

---

## 2. Productos (Inventario)

- [ ] **Listar**: Andá a Inventario → se ven todos los productos
- [ ] **Crear**: Agregá un producto: "Producto Test", precio 5000, costo 3000, stock 10, stock mín 3
- [ ] **Buscar**: Usá el buscador de productos por nombre
- [ ] **Editar**: Cambiale el precio a 6000
- [ ] **Stock bajo**: Verificá que aparezca en "Productos con stock bajo" en el Dashboard si el stock está por debajo del mínimo

---

## 3. Venta Rápida (POS) — Efectivo

- [ ] **POS muestra todos**: Andá a Venta Rápida → deben verse todos los productos (no solo 25)
- [ ] **Agregar al carrito**: Click en un producto → aparece en el carrito con cantidad 1
- [ ] **Cambiar cantidad**: Subí la cantidad a 2
- [ ] **Ver ganancia**: En el carrito se ve la **ganancia por item** (precio - costo) y el **total de ganancia** con margen %
- [ ] **Completar venta**: Click "Cobrar" → seleccioná Efectivo → Confirmar
- [ ] **Stock descontado**: Volvé a Inventario → el producto tiene stock 8 (10 - 2)

---

## 4. Ventas — Fiado (Crédito)

- [ ] **Crear cliente**: Andá a Clientes/Fiados → Agregar "Cliente Test", cupo 50000
- [ ] **Venta a fiado**: Venta Rápida → agregá producto → "Cobrar" → seleccioná Fiado → elegí "Cliente Test" → Confirmar
- [ ] **Deuda actualizada**: En Clientes/Fiados → "Cliente Test" debe tener deuda actualizada
- [ ] **Límite respetado**: Intentá hacer una venta a fiado que supere el cupo del cliente → debe rechazarla (error 400, límite de crédito excedido)

---

## 5. Abonos (Pagos de Fiado)

- [ ] **Pagar deuda**: En Clientes/Fiados → click en "Cliente Test" → "Registrar Pago" → Ingresá un monto → Confirmar
- [ ] **Deuda reducida**: La deuda del cliente debe haber disminuido
- [ ] **Historial**: Se ve el pago registrado en el historial del cliente

---

## 6. Gastos

- [ ] **Agregar gasto**: Andá a Gastos → "Agregar Gasto" → Categoría "Otros", descripción "Prueba", monto 10000, fecha hoy
- [ ] **Filtrar**: Usá el filtro de fechas para ver gastos de esta semana

---

## 7. Dashboard

- [ ] **Ventas totales**: El dashboard muestra las ventas de hoy (efectivo + fiado)
- [ ] **Ganancia**: Se ve la ganancia total del día debajo de las ventas
- [ ] **Gastos**: Se ve el gasto que cargaste
- [ ] **Productos bajos**: Se ve el producto con stock bajo (si aplica)

---

## 8. Cierre de Caja

- [ ] **Iniciar cierre**: Andá a Cerrar Turno → debe mostrar el total esperado en efectivo
- [ ] **Ingresar conteo**: Ingresá el efectivo contado (puede ser el mismo valor)
- [ ] **Discrepancia**: Si el valor coincide → discrepancia $0; si no, muestra la diferencia
- [ ] **Confirmar cierre**: Click "Cerrar Turno" → el día queda cerrado

---

## 9. Reportes

- [ ] **Reporte semanal**: Andá a Reportes → se ve el resumen de la semana
- [ ] **Ganancias**: Las ganancias calculadas usan `cost_at_sale` (el costo al momento de la venta, no el precio actual del producto)
- [ ] **Actividad reciente**: Se ven las últimas acciones (ventas, pagos, gastos)

---

## 10. Exportar Datos

- [ ] **Exportar productos**: Ajustes → Exportar → click en Productos → descarga XLSX
- [ ] **Exportar clientes**: Misma sección → descarga XLSX
- [ ] **Exportar ventas**: Misma sección → descarga XLSX
- [ ] **Exportar gastos**: Misma sección → descarga XLSX

---

## 11. Backup

- [ ] **Exportar DB**: Ajustes → Backup → Exportar base de datos → descarga `.db.gz`
- [ ] **Restaurar**: Seleccionar archivo de backup → Confirmar restauración (con cuidado — borra datos actuales)

---

## 12. Regresión (post-pruebas)

- [ ] **Limpiar datos de prueba**: Borrar "Producto Test", "Cliente Test", ventas de prueba y gasto de prueba
- [ ] **Verificar que no haya errores**: `tsc --noEmit` → 0 errores
- [ ] **Tests**: `python manage.py test` → todos OK

---

### Si encontrás algún error, anotalo abajo:

| Paso | Error encontrado |
|------|------------------|
| | |
| | |
