# 🚚 Sistema de Gestión de Mudanzas - Frontend

Frontend desarrollado en React + Vite para el sistema de gestión de mudanzas.

## 🎨 Características

- ✅ Autenticación con JWT
- ✅ Dashboard interactivo con navegación lateral
- ✅ Gestión completa de:
  - Usuarios (CRUD)
  - Clientes (CRUD)
  - Vehículos (CRUD)
  - Servicios de mudanza (CRUD con cotización automática)
  - Tarifas (Visualización y edición)
  - Pagos (CRUD con cálculo de cambio/saldo)
  - Reportes y estadísticas
- ✅ Tema oscuro con acentos rojos
- ✅ Interfaz responsive

## 🛠️ Tecnologías

- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **React Router DOM** - Navegación
- **Axios** - Cliente HTTP
- **CSS3** - Estilos personalizados

## 📋 Requisitos Previos

- Node.js 16+ 
- npm o yarn
- Backend corriendo en `http://localhost:8080`

## 🚀 Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/EmmanuelCardenasITM/proyecto-mudanzas-frontend.git
cd proyecto-mudanzas-frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar la URL del backend (si es diferente):
Editar `src/services/api.js` y cambiar la `baseURL`

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

5. Abrir en el navegador:
```
http://localhost:5173
```

## 🔑 Credenciales de Prueba

- **Email:** admin@mudanzas.com
- **Password:** Admin123!

## 📦 Scripts Disponibles

```bash
npm run dev          # Inicia el servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Preview de la build de producción
npm run lint         # Ejecuta el linter
```

## 🏗️ Estructura del Proyecto

```
src/
├── assets/          # Imágenes y recursos estáticos
├── components/      # Componentes reutilizables
│   └── PrivateRoute.jsx
├── context/         # Context API (AuthContext)
├── pages/           # Páginas de la aplicación
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── GestionUsuarios.jsx
│   ├── GestionClientes.jsx
│   ├── GestionVehiculos.jsx
│   ├── GestionServicios.jsx
│   ├── GestionTarifas.jsx
│   ├── GestionPagos.jsx
│   └── Reportes.jsx
├── services/        # Servicios API
│   ├── api.js
│   ├── authService.js
│   ├── clienteService.js
│   ├── vehiculoService.js
│   ├── servicioService.js
│   ├── tarifaService.js
│   ├── pagoService.js
│   └── usuarioService.js
└── styles/          # Estilos globales
```

## 🔗 Backend

Este frontend se conecta con el backend Spring Boot del sistema de mudanzas.
Repositorio del backend: [Agregar URL cuando esté disponible]

## 👨‍💻 Autor

**Emmanuel Cardenas**
- GitHub: [@EmmanuelCardenasITM](https://github.com/EmmanuelCardenasITM)
- Email: emmanuelcardenas327087@correo.itm.edu.co

## 📄 Licencia

Este proyecto es parte de un trabajo académico del ITM.
