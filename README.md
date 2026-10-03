# OnControl - Sistema de Gestión Médica

OnControl es una aplicación web moderna desarrollada con Next.js 15.5.3 que facilita la gestión integral de pacientes oncológicos y su seguimiento médico. El sistema está diseñado para médicos oncólogos y pacientes, proporcionando herramientas especializadas para el manejo de tratamientos, citas, medicamentos y seguimiento de síntomas.

## 🚀 Características Principales

### 👨‍⚕️ Panel Médico
- **Dashboard**: Vista general con estadísticas y resumen de pacientes
- **Gestión de Pacientes**: Lista completa con filtros y búsqueda avanzada
- **Calendario de Citas**: Programación y gestión de citas médicas
- **Tratamientos**: Seguimiento de protocolos de tratamiento oncológico
- **Reportes**: Análisis y estadísticas del centro médico
- **Notificaciones**: Sistema de alertas y recordatorios
- **Perfil Médico**: Información profesional y académica

### 👩‍🦱 Panel Paciente
- **Dashboard**: Vista personalizada con información relevante
- **Mi Tratamiento**: Detalles del protocolo de tratamiento actual
- **Mis Citas**: Historial y próximas citas programadas
- **Síntomas**: Registro y seguimiento de síntomas
- **Medicamentos**: Gestión de medicación y recordatorios
- **Notificaciones**: Alertas personalizadas y recordatorios
- **Historial Médico**: Registro completo de atención médica
- **Perfil Paciente**: Información personal y médica

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15.5.3 con Turbopack
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes UI**: shadcn/ui
- **Iconos**: Lucide React
- **Fechas**: date-fns
- **Autenticación**: Sistema personalizado con localStorage

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── auth/                    # Páginas de autenticación
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   └── dashboard/
│       ├── medico/              # Panel médico
│       │   ├── calendario/
│       │   ├── citas/
│       │   ├── notificaciones/
│       │   ├── pacientes/
│       │   ├── perfil/
│       │   ├── reportes/
│       │   └── tratamientos/
│       └── paciente/           # Panel paciente
│           ├── citas/
│           ├── historial/
│           ├── medicamentos/
│           ├── notificaciones/
│           ├── perfil/
│           ├── sintomas/
│           └── tratamiento/
├── components/
│   ├── ui/                      # Componentes UI reutilizables
│   ├── auth-guard.tsx          # Protección de rutas
│   ├── dashboard-layout.tsx    # Layout principal del dashboard
│   ├── icons.tsx              # Iconos personalizados
│   └── oncontrol-logo.tsx     # Logo del sistema
└── lib/
    └── utils.ts               # Utilidades generales
```

## 🔐 Credenciales de Acceso

### Médicos
```
Email: carlos.mendoza@oncontrol.pe
Contraseña: medico123
```

### Pacientes
```
Email: maria.gonzalez@email.com
Contraseña: paciente123
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd on-control
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   # o
   yarn dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 📱 Funcionalidades Detalladas

### 🔐 Sistema de Autenticación
- Login seguro con validación de credenciales
- Registro de nuevos usuarios (médicos y pacientes)
- Recuperación de contraseña
- Protección de rutas con AuthGuard
- Gestión de sesiones con localStorage

### 📊 Dashboard Médico
- **Estadísticas en tiempo real**: Pacientes activos, citas pendientes, tratamientos
- **Acciones rápidas**: Nuevo paciente, nueva cita, reportes
- **Gráficos de progreso**: Satisfacción de pacientes, adherencia a tratamientos
- **Pacientes recientes**: Lista de pacientes con información relevante

### 👥 Gestión de Pacientes
- **Lista completa**: Todos los pacientes con filtros avanzados
- **Búsqueda**: Por nombre, diagnóstico, estado
- **Acciones**: Ver detalles, editar, programar citas
- **Estados**: Activo, en tratamiento, seguimiento
- **Información detallada**: Historial médico, tratamientos actuales

### 📅 Calendario de Citas
- **Vista mensual**: Calendario interactivo con citas programadas
- **Nueva cita**: Formulario completo de programación
- **Filtros**: Por médico, tipo de cita, estado
- **Recordatorios**: Notificaciones automáticas

### 💊 Gestión de Tratamientos
- **Protocolos**: Seguimiento de tratamientos oncológicos
- **Nuevo tratamiento**: Formulario de creación de protocolos
- **Estados**: Activo, pausado, completado
- **Medicamentos**: Lista de medicamentos por tratamiento

### 📈 Reportes Médicos
- **Estadísticas generales**: Pacientes, citas, tratamientos
- **Gráficos**: Satisfacción, adherencia, progreso
- **Filtros temporales**: Por mes, trimestre, año
- **Exportación**: Preparado para exportar a PDF/Excel

### 🔔 Sistema de Notificaciones
- **Tipos de notificación**: Citas, tratamientos, síntomas, medicamentos, sistema
- **Prioridades**: Alta, media, baja con colores distintivos
- **Filtros**: Por tipo y estado (leídas/sin leer)
- **Acciones**: Marcar como leída, eliminar, enlaces directos
- **Contador**: Badge con número de notificaciones sin leer

### 👤 Perfiles de Usuario
- **Perfil médico**: Información personal, académica, profesional
- **Perfil paciente**: Datos personales, médicos, contacto de emergencia
- **Preferencias**: Configuración de notificaciones y recordatorios
- **Estadísticas**: Progreso y métricas personales

### 📋 Historial Médico
- **Entradas del historial**: Consultas, procedimientos, cirugías
- **Signos vitales**: Presión arterial, frecuencia cardíaca, temperatura, peso
- **Resultados de laboratorio**: Con indicadores de valores normales/anormales
- **Medicamentos**: Historial completo de medicación
- **Alergias**: Registro de alergias conocidas
- **Historial familiar**: Condiciones médicas familiares

### 💊 Gestión de Medicamentos (Pacientes)
- **Dosis de hoy**: Medicamentos programados para el día actual
- **Adherencia**: Seguimiento de cumplimiento de medicación
- **Recordatorios**: Configuración de alertas personalizadas
- **Efectos secundarios**: Registro de síntomas relacionados
- **Instrucciones**: Detalles específicos de cada medicamento

### 📊 Registro de Síntomas
- **Síntomas comunes**: Fatiga, náuseas, dolor, etc.
- **Escala de intensidad**: Del 1 al 10
- **Frecuencia**: Diaria, semanal, según necesidad
- **Historial**: Seguimiento temporal de síntomas
- **Alertas**: Notificaciones por síntomas severos

## 🎨 Diseño y UX

### Principios de Diseño
- **Responsive**: Adaptable a todos los dispositivos
- **Accesible**: Cumple estándares de accesibilidad web
- **Intuitivo**: Navegación clara y consistente
- **Profesional**: Diseño médico apropiado para el contexto

### Componentes UI
- **Cards**: Para agrupar información relacionada
- **Badges**: Para estados y categorías
- **Progress bars**: Para mostrar progreso y adherencia
- **Tabs**: Para organizar contenido complejo
- **Modals**: Para formularios y confirmaciones
- **Tables**: Para listas de datos estructurados

### Paleta de Colores
- **Primario**: Azul médico profesional
- **Secundario**: Verde para estados positivos
- **Acento**: Naranja para alertas y recordatorios
- **Destructivo**: Rojo para alertas críticas
- **Neutro**: Grises para texto y fondos

## 🔧 Configuración del Entorno

### Variables de Entorno
```env
NEXT_PUBLIC_APP_NAME=OnControl
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_API_URL=https://backend-vdtj.onrender.com
NEXT_PUBLIC_EDGE_API_URL=https://edgeservice.onrender.com
```

Para prueba local de la demo IoT:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_EDGE_API_URL=http://localhost:5000
```

La card `RealtimeVitalsCard` consume `GET ${NEXT_PUBLIC_EDGE_API_URL}/OnControl/parameters/latest-demo` cada 3000 ms y se muestra en el dashboard del paciente.

## Deploy en Vercel

Build command:

```bash
npm run build
```

Output framework:

```text
Next.js
```

Variables en Vercel:

```env
NEXT_PUBLIC_API_URL=https://backend-vdtj.onrender.com
NEXT_PUBLIC_EDGE_API_URL=https://edgeservice.onrender.com
```

Pruebas despues del deploy:

- Abrir `/demo-iot` para validar la integracion IoT sin login.
- Abrir `/auth/login` y probar credenciales demo del backend.
- Entrar como paciente y validar `/dashboard/paciente`.
- Confirmar que la card IoT se actualiza cada 3 segundos cuando EdgeService recibe datos.

Credenciales demo esperadas si el backend fue desplegado con base vacia y seed activo:

```text
admin.grupo2@oncontrol.com / OnControl2026!
doctor.grupo2@oncontrol.com / OnControl2026!
paciente.grupo2@oncontrol.com / OnControl2026!
```

### Scripts Disponibles
```bash
npm run dev          # Desarrollo
npm run build        # Producción
npm run start        # Servidor de producción
npm run lint         # Linting
```

## 📝 Datos Mock

El sistema incluye datos de ejemplo para demostración:

### Pacientes de Ejemplo
- María González (Cáncer de mama)
- Carlos Mendoza (Cáncer de próstata)
- Ana Rodríguez (Cáncer de pulmón)
- Pedro Sánchez (Cáncer de colon)

### Médicos de Ejemplo
- Dr. Carlos Mendoza (Oncólogo)
- Dr. Ana Rodríguez (Cirujana Oncológica)
- Dr. Luis Pérez (Radioterapeuta)

### Tratamientos de Ejemplo
- Quimioterapia AC-T
- Radioterapia
- Cirugía de conservación
- Tratamiento hormonal

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Equipo de Desarrollo

- **Desarrollador Principal**: [Tu Nombre]
- **Diseño UX/UI**: [Diseñador]
- **Consultor Médico**: [Médico Oncólogo]

## 📞 Soporte

Para soporte técnico o consultas médicas:
- **Email**: soporte@oncontrol.com
- **Teléfono**: +1 (555) 123-4567
- **Horario**: Lunes a Viernes, 8:00 AM - 6:00 PM

## 🔮 Roadmap Futuro

### Versión 2.0
- [ ] Integración con sistemas hospitalarios
- [ ] Telemedicina integrada
- [ ] App móvil nativa
- [ ] IA para análisis de síntomas
- [ ] Integración con dispositivos médicos

### Versión 2.1
- [ ] Sistema de citas en tiempo real
- [ ] Chat médico-paciente
- [ ] Recordatorios por SMS/Email
- [ ] Dashboard de familiares
- [ ] Integración con farmacias

---

**OnControl** - Transformando la atención médica oncológica a través de la tecnología.

*Desarrollado con ❤️ para mejorar la calidad de vida de pacientes y médicos.*
