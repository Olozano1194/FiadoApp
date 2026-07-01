# FiadoApp 🏪

Sistema POS (Punto de Venta) para tiendas de barrio con gestión de **fiado** (crédito),
inventario, clientes, reportes semanales y exportación de datos.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | React + Vite + TypeScript | React 19, Vite 8, TS 6 |
| **Estado** | Zustand | 5.x |
| **Estilos** | Tailwind CSS | 4.x |
| **Backend** | Django REST Framework | Django 6, DRF 3.17 |
| **Base de datos** | MySQL (dev: SQLite) | — |
| **Autenticación** | JWT (SimpleJWT) | Access 30min + Refresh 1d |

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Pages   │  │Components│  │  Zustand Stores   │   │
│  │(rutas)   │──│(reusables)│──│(auth, sale,       │   │
│  │          │  │          │  │ product, client,   │   │
│  │          │  │          │  │ report, dashboard) │   │
│  └──────────┘  └──────────┘  └────────┬─────────┘   │
│                                        │              │
│  ┌─────────────────────────────────────▼──────────┐  │
│  │              API Layer (Axios)                  │  │
│  │  • Interceptor agrega Bearer token              │  │
│  │  • Interceptor refresca token automaticamente   │  │
│  │  • Cola de requests durante refresh             │  │
│  └─────────────────────────────────────┬──────────┘  │
└────────────────────────────────────────┼──────────────┘
                                         │
                                   HTTP/JSON
                                         │
┌────────────────────────────────────────┼──────────────┐
│                    Backend (Django)    ▼              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Views   │  │Serializers│  │     Models        │   │
│  │(APIViews │──│(validación)──│(Product, Client,  │   │
│  │ViewSets) │  │          │  │ Sale, FiadoPayment)│   │
│  └──────────┘  └──────────┘  └────────┬─────────┘   │
│                                        │              │
│  ┌─────────────────────────────────────▼──────────┐  │
│  │            MySQL / SQLite                       │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Patrón de datos:** `Model → ViewSet/APIView → Serializer → API (Axios) → Store (Zustand) → Componente`

---

## Requisitos

- **Python** 3.12+
- **Node.js** 22+
- **MySQL** 8+ (opcional, por defecto usa SQLite)

---

## Cómo Empezar

### 1. Backend

```bash
# Entrar al directorio del backend
cd FiadoApp

# Crear y activar entorno virtual (si no existe)
python -m venv env
.\env\Scripts\activate  # Windows
# source env/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Variables de entorno (opcional, defaults funcionan para dev)
# Crear archivo .env en la raíz:
#   DATABASE_URL=mysql://root:password@localhost:3306/dbFiadoApp
#   DJANGO_SECRET_KEY=clave-segura-aqui
#   DJANGO_DEBUG=True

# Migrar base de datos
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

### 2. Frontend

```bash
# Entrar al directorio del frontend
cd frontend

# Instalar dependencias
npm install

# Variables de entorno (opcional)
# Crear archivo .env en frontend/:
#   VITE_API_URL_DEV=http://localhost:8000/api/

# Iniciar servidor de desarrollo
npm run dev
```

La app se abre en `http://localhost:5173`.

---

## Estructura del Proyecto

```
FiadoApp/
│
├── config/                    # Configuración Django
│   └── settings.py            # Settings (DB, JWT, CORS, etc.)
│
├── coreApp/                   # App principal Django
│   ├── models.py              # Modelos: Category, Product, Client, Sale, SaleItem, FiadoPayment
│   ├── views/                 # ViewSets + APIViews organizados por dominio
│   │   ├── auth.py            # Autenticación JWT
│   │   ├── products.py        # Productos + stock bajo
│   │   ├── clients.py         # Clientes + deudores
│   │   ├── sales.py           # Ventas, historial, recientes
│   │   ├── categories.py      # Categorías
│   │   ├── expenses.py        # Gastos
│   │   ├── payments.py        # Pagos de fiado
│   │   ├── dashboard.py       # Dashboard stats
│   │   ├── reports.py         # Reportes semanales + actividad reciente
│   │   ├── imports.py         # Importación de productos desde Excel
│   │   ├── import_helpers.py  # Helpers de importación
│   │   ├── exports.py         # Exportación a Excel
│   │   ├── cash_closure.py    # Cierre de caja
│   │   ├── backup.py          # Backup manual
│   │   ├── store_config.py    # Configuración de tienda
│   │   ├── search.py          # Búsqueda global
│   │   ├── health.py          # Health check
│   │   └── helpers.py         # Utilidades compartidas
│   ├── serializers.py         # Serializers con lógica de negocio
│   └── urls.py                # Rutas API
│
├── frontend/
│   └── src/
│       ├── pages/             # Páginas (rutas)
│       │   ├── LoginPage.tsx
│       │   ├── HomePage.tsx          # Dashboard
│       │   ├── PosPage.tsx           # Venta Rápida (POS)
│       │   ├── ProductsPage.tsx      # Inventario
│       │   ├── ClientsPage.tsx       # Clientes + Fiado
│       │   ├── SalesHistoryPage.tsx  # Historial de ventas
│       │   ├── ReportPage.tsx        # Reportes semanales
│       │   ├── SettingsPage.tsx      # Ajustes + Exportación
│       │   └── Error404.tsx
│       │
│       ├── components/
│       │   ├── auth/          # ProtectedRoute
│       │   ├── layout/        # SideBar, Header, Footer, Table
│       │   ├── headerNav/     # NavHeader, NotificationMenu
│       │   ├── pos/           # ProductSearch, CartPanel, PaymentBar, SaleReceipt, ClientSelect
│       │   ├── sections/      # HeroSection, CardsSection, TableSection, LowStockSection, etc.
│       │   ├── reportes/      # MetricsSection, WeeklyChartCard, RecentActivityCard
│       │   └── ui/            # ProductModal, ClientsModal, PaymentModal, StockOrderModal
│       │
│       ├── stores/            # Zustand
│       │   ├── authStore.ts
│       │   ├── saleStore.ts
│       │   ├── productStore.ts
│       │   ├── clientStore.ts
│       │   ├── reportStore.ts
│       │   └── dashboardStore.ts
│       │
│       ├── api/               # Clientes Axios
│       │   ├── axios.config.ts        # Config + interceptors JWT
│       │   ├── auth.api.ts
│       │   ├── products.api.ts
│       │   ├── clients.api.ts
│       │   ├── sales.api.ts
│       │   ├── categories.api.ts
│       │   ├── dashboard.api.ts
│       │   ├── reports.api.ts
│       │   ├── search.api.ts
│       │   ├── fiado-payments.api.ts
│       │   └── settings.api.ts
│       │
│       └── models/            # Tipos TypeScript
│           ├── auth.ts
│           ├── product.ts
│           ├── client.ts
│           ├── sale.ts
│           ├── report.ts
│           └── ...
│
├── requirements.txt
├── manage.py
└── .env
```

---

## Features Principales

### 🏪 POS / Venta Rápida
- Búsqueda y filtro de productos por categoría
- Carrito lateral con controles de cantidad (+/-)
- Métodos de pago: **Efectivo** o **Crédito (Fiado)**
- Validación de stock en tiempo real
- Bloqueo pesimista con `select_for_update()` para evitar race conditions
- Comprobante post-venta

### 👥 Clientes
- CRUD completo con búsqueda
- Límite de crédito por cliente
- Registro de pagos con validación (no permite pagar más de la deuda)
- Badge "DEUDOR" en clientes con deuda > 0
- Resumen de cobros: total por cobrar, clientes con deuda, cobros de hoy

### 📦 Inventario
- CRUD de productos
- Categorización
- Stock mínimo + alerta de stock bajo
- Imagen por archivo o URL
- Código de barras

### 📊 Reportes
- Stats semanales con navegación (semana anterior/siguiente)
- Gráfico de barras interactivo con alturas proporcionales (click para ver detalle por día)
- Producto estrella de la semana con imagen (si existe)
- Tendencia vs semana anterior (porcentaje o multiplicador)
- Feed de actividad reciente (ventas + pagos)

### 📈 Dashboard
- Cards de resumen: ventas del día, fiado pendiente, stock bajo
- Tabla de ventas recientes con total
- Notificaciones combinadas (stock bajo, deudores, resumen)
- FAB Speed Dial con acciones rápidas

### ⚙️ Ajustes
- Cambio de contraseña
- Perfil de usuario
- Exportación de datos a Excel (clientes, productos, ventas)

---

## API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `api/token/` | POST | Login JWT |
| `api/token/refresh/` | POST | Refresh token |
| `api/token/verify/` | POST | Verificar token |
| `api/categories/` | CRUD | Categorías |
| `api/products/` | CRUD | Productos |
| `api/products/low-stock/` | GET | Stock bajo |
| `api/clients/` | CRUD | Clientes |
| `api/clients/?debt=true` | GET | Filtrar deudores |
| `api/sales/` | CRUD | Ventas |
| `api/sales/recent/` | GET | Ventas recientes |
| `api/sales/history/` | GET | Historial paginado |
| `api/fiado-payments/` | CRUD | Pagos de fiado |
| `api/fiado-payments/today/` | GET | Pagos del día |
| `api/dashboard/stats/` | GET | Stats dashboard |
| `api/search/?q=` | GET | Búsqueda global |
| `api/reports/stats/` | GET | Stats semanales |
| `api/reports/recent-activity/` | GET | Actividad reciente |
| `api/change-password/` | POST | Cambiar contraseña |
| `api/export/clients/` | GET | Exportar clientes |
| `api/export/products/` | GET | Exportar productos |
| `api/export/sales/` | GET | Exportar ventas |
| `api/import/products/template/` | GET | Descargar plantilla Excel |
| `api/import/products/` | POST | Importar productos desde Excel |
| `api/import/products/?preview=true` | POST | Validar sin persistir (preview) |

---

## Notas de Seguridad

- Todos los endpoints requieren autenticación JWT (excepto `/api/token/*`)
- Los tokens access expiran en **30 minutos**, refresh en **1 día**
- `current_debt` de cliente SOLO se modifica via ventas CREDIT y pagos (nunca directamente)
- El checkout usa `select_for_update()` + `transaction.atomic()` para evitar race conditions
- Las ventas CREDIT validan que no se exceda el `credit_limit` del cliente
- Los pagos validan que el monto no supere la deuda actual

---

## Variables de Entorno

### Backend (`.env` en raíz)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///db.sqlite3` | Conexión a BD (MySQL, PostgreSQL, SQLite) |
| `DJANGO_SECRET_KEY` | Fallback dev | Clave secreta Django |
| `DJANGO_DEBUG` | `False` | Modo debug (True en desarrollo) |

### Frontend (`.env` en `frontend/`)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `VITE_API_URL_DEV` | `http://localhost:8000/api/` | URL base de la API |

---

## Posibles Mejoras Futuras

- [x] **Migración a Desktop** con Tauri (React embebido + Rust backend opcional)
- [x] Reporte de ganancias (precio de costo vs precio de venta)
- [ ] Tests automatizados (Vitest + pytest)
- [ ] Paginación server-side en listados de productos y clientes
- [ ] Roles de usuario (admin, cajero)
- [ ] Historial de stock (entradas, salidas, ajustes)
- [ ] Impresión de tickets
- [ ] Múltiples precios (por unidad, por mayoreo)

---

## 🖥️ Desktop Packaging con Tauri v2

FiadoApp se empaqueta como aplicación de escritorio nativa para Windows usando **Tauri v2**. El frontend React + Vite se renderiza en WebView2, y el backend Django corre como proceso sidecar.

### Arquitectura

```
┌──────────────────────────────────────────┐
│ Tauri Window (WebView2)                  │
│  ┌────────────────────────────────────┐  │
│  │ React SPA (frontend/dist/)         │  │
│  │ Axios → http://localhost:8000/api/ │  │
│  └────────────────────────────────────┘  │
│                     │                     │
│  ┌────────────────────────────────────┐  │
│  │ Rust Core (tauri-plugin-shell)     │  │
│  │ Spawn / Kill → fiadoapp-backend    │  │
│  └────────────────────────────────────┘  │
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│ Sidecar: fiadoapp-backend.exe (Django)   │
│ SQLite + media en %APPDATA%/FiadoApp     │
│ http://127.0.0.1:8000                    │
└──────────────────────────────────────────┘
```

**Clave**: La comunicación es 100% HTTP. No hay IPC Rust ↔ Frontend. La capa de API (axios) no requirió cambios.

### Prerrequisitos

| Herramienta | Versión | Instalación |
|------------|---------|-------------|
| Rust | ≥ 1.80 | https://rustup.rs |
| MSVC Build Tools | 2022 | VS Build Tools + "Desktop C++" workload |
| Node.js | ≥ 20 | https://nodejs.org |
| Python | 3.12 | https://python.org |
| Tauri CLI | 2.x | `npm install -D @tauri-apps/cli` |

### Desarrollo

```bash
# Terminal 1: Backend
python backend_server.py

# Terminal 2: Frontend + Tauri
cd frontend
npm run tauri:dev
```

- `tauri:dev` abre ventana nativa apuntando a Vite dev server (HMR funciona)
- Backend corre independientemente en `:8000`

### Build completo (MSI Installer)

```powershell
# 1. Activar entorno virtual
env\Scripts\Activate.ps1

# 2. Construir backend (sin ventana de consola)
pyinstaller fiadoapp-windowed.spec --noconfirm

# 3. Ejecutar script de build Tauri
scripts\build-tauri.ps1
```

O en un solo paso:

```powershell
env\Scripts\Activate.ps1 && scripts\build-tauri.ps1
```

### Output del build

```
frontend/src-tauri/target/release/bundle/
├── msi/
│   └── FiadoApp_0.1.0_x64_es-ES.msi    ~5 MB
└── nsis/
    └── FiadoApp_0.1.0_x64-setup.exe     ~4 MB
```

### Sidecar

El backend Django se empaqueta con PyInstaller y se copia a `src-tauri/binaries/` con el sufijo de target triple:

```
fiadoapp-backend-x86_64-pc-windows-msvc.exe  (~8 MB)
_internal/                                     (~55 MB, Python runtime)
```

Tauri lo lanza al abrir la app y lo mata al cerrar la ventana. Los logs del backend se muestran en la terminal de desarrollo.

### Datos persistentes

- **Base de datos**: `%APPDATA%/FiadoApp/fiadoapp.db` (SQLite)
- **Imágenes subidas**: `%APPDATA%/FiadoApp/media/`
- **Logs**: `%APPDATA%/FiadoApp/logs/`

### Solución de problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| "WebView2 not found" | Windows sin WebView2 | Tauri lo instala automáticamente, o descargar de Microsoft |
| Ventana en blanco | Backend no arrancó | Esperar ~5s, verificar que el puerto 8000 no esté ocupado |
| "Connection refused" | Sidecar no iniciado | Cerrar y reabrir la app. Si persiste, revisar logs |
| MSI no se instala | Windows Defender | Click en "Más info" → "Ejecutar de todas formas" |

### Estructura de src-tauri/

```
frontend/src-tauri/
├── Cargo.toml              # Dependencias Rust
├── tauri.conf.json         # Config: ventana, bundle, CSP
├── build.rs                # Build script Tauri
├── capabilities/
│   └── default.json        # Permisos (shell sidecar)
├── icons/                  # Iconos multi-resolución
├── binaries/               # Sidecar binary (gitignored)
└── src/
    ├── main.rs             # Entry point
    └── lib.rs              # Sidecar lifecycle + setup
```