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
│   ├── views.py               # ViewSets + APIViews (~516 líneas)
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

- [ ] **Migración a Desktop** con Tauri (React embebido + Rust backend opcional)
- [ ] Lazy loading de páginas con `React.lazy()` + `Suspense`
- [ ] Tests automatizados (Vitest + pytest)
- [ ] Paginación server-side en listados de productos y clientes
- [ ] Modo offline (Service Workers + IndexedDB)
- [ ] Roles de usuario (admin, cajero)
- [ ] Historial de stock (entradas, salidas, ajustes)
- [ ] Impresión de tickets
- [ ] Múltiples precios (por unidad, por mayoreo)
- [ ] Reporte de ganancias (precio de costo vs precio de venta)
