# CODISPRO - Documentación Completa

## 🎯 Información General

**Sistema:** CODISPRO - Sistema de Gestión Integral para Constructoras  
**Tecnología:** Next.js 16 + TypeScript + Prisma + MySQL + Tailwind CSS + shadcn/ui  
**Base de Datos:** MySQL en Clever Cloud  
**Versión:** 1.0.0

---

## 🔑 CÓDIGOS DE ACCESO DE PRUEBA

Visita `/api/setup/test-users` para crear los usuarios de prueba automáticamente:

| Código | Usuario | Rol |
|--------|----------|-----|
| `ADMIN001` | Administrador | admin - Acceso total |
| `GERENTE002` | Gerente General | manager - Gestión completa |
| `OBRERO003` | Juan Pérez | worker - Acceso limitado |
| `SUPERVISOR004` | María López | manager - Supervisión |

**Instrucciones:**
1. Abre tu navegador y ve a la aplicación
2. Ingresa cualquiera de los códigos anteriores
3. Accede con el nivel de permisos que necesites
4. Prueba todas las funcionalidades

---

## 📋 MÓDULOS IMPLEMENTADOS

### 1. ✅ Autenticación por Código
- Sistema de login con código único
- Almacenamiento seguro de sesión
- Verificación de estado del usuario
- Roles: admin, manager, worker

### 2. ✅ Dashboard Avanzado
- 5 tarjetas KPI en tiempo real
- Gráficos interactivos (circular y de barras)
- Alertas de herramientas no devueltas
- Actualización en tiempo real de datos

### 3. ✅ Trabajadores
- CRUD completo (Crear, Leer, Actualizar, Eliminar)
- Campos: nombre, apellido, DPI, foto, fecha nacimiento, teléfono, dirección, cargo, tarifa
- Búsqueda y filtrado
- Tarjetas de estadísticas

### 4. ✅ Herramientas
- Inventario completo
- Sistema de préstamos y devoluciones
- Código de barras
- Calendario de préstamos
- Estados: Disponible, En Uso, Mantenimiento, Retirado

### 5. ✅ Vehículos
- Inventario de flota
- Tres secciones: Flota, Repuestos, Viajes
- Estados: Disponible, En Viaje, Mantenimiento
- Preparado para gestión de repuestos con facturas
- Preparado para calendario de viajes

### 6. ✅ Envíos
- Control de materiales enviados
- Asignación de vehículo y conductor
- Diálogo de recepción con verificación
- **Detección automática de discrepancias** (cantidad enviada ≠ recibida)
- Estados: Pendiente, Enviado, Recibido, Discrepancia

### 7. ✅ Caja Chica
- Registro de ingresos y egresos
- Categorías: Combustible, Suministros, Alimentos, Materiales, Transporte, Otro
- Filtrado por mes y tipo
- **Cálculo en tiempo real del balance**
- Asociación a proyectos
- Soporte para URL de recibos/facturas

### 8. ✅ Proyectos
- CRUD completo de proyectos
- **Página de detalle con gestión completa:**
  - Personal asignado (Staff)
  - Envíos del proyecto
  - Movimientos de caja chica
  - Gastos del proyecto
  - Actualización de progreso (0-100%)
- Estados: Planificación, Activo, Pausado, Completado, Cancelado
- Presupuesto y cliente
- Cálculo de gastos vs presupuesto

### 9. ✅ Ubicación en Tiempo Real
- Rastreo GPS de camiones
- WebSocket para comunicación en tiempo real
- Historial de ubicaciones (7 días)
- Visualización de usuarios activos
- Funcionamiento en segundo plano

### 10. ✅ PWA (Progressive Web App)
- Instalación en home screen
- Soporte offline
- Iconos generados con IA
- Manifest completo con atajos

### 11. ✅ Calendario Integrado Global
- Vista unificada de todas las actividades
- Filtrado por tipo de evento
- Navegación mensual
- Leyenda de colores por tipo:
  - Naranja: Préstamos de herramientas
  - Verde: Viajes de vehículos
  - Azul: Envíos de materiales
  - Púrpura: Movimientos de caja chica
  - Rosa: Proyectos

### 12. ✅ Exportación a Excel
- Exportación de trabajadores
- Exportación de herramientas
- Exportación de caja chica (por mes)
- Formato en español localizado
- Resumen automático

### 13. ✅ Exportación a PDF
- Reporte general con métricas de todos los módulos
- Reporte de trabajadores
- Reporte de herramientas
- Reporte de vehículos
- Reporte de proyectos
- Formato profesional con tablas

### 14. ✅ Sistema de Backup y Restauración
- Exportación completa de la base de datos en JSON
- Incluye las 15 tablas del sistema
- Restauración con borrado de datos existentes
- Transacciones para integridad de datos
- Versionamiento y timestamps

### 15. ✅ Notificaciones
- Panel de notificaciones con badge de no leídas
- Tipos: warning, success, info
- Acciones personalizadas
- Alertas automáticas

---

## 🚀 INSTRUCCIONES DE IMPLEMENTACIÓN LOCAL

### Requisitos Previos

```bash
# Node.js y Bun
node -v  # Debe ser 18+
bun -v  # Debe ser 1.3.6+

# Verificar instalación
bun --version
```

### Paso 1: Clonar e Instalar Dependencias

```bash
# Navegar al directorio del proyecto
cd /home/z/my-project

# Instalar dependencias
bun install

# Esto instalará:
# - Next.js 16
# - React 19
# - TypeScript 5
# - Prisma
# - Tailwind CSS 4
# - shadcn/ui components
# - Socket.IO
# - Recharts
# - jsPDF
# - date-fns
# - Y más dependencias
```

### Paso 2: Configurar Base de Datos

```bash
# El archivo .env ya está configurado con:
# DATABASE_URL="mysql://us1c5wbm2waphqnm:vwFAkN5AuK4FAnyB3QQo@bkzonlznatzzfkelstum-mysql.services.clever-cloud.com:3306/bkzonlznatzzfkelstum"

# No necesitas configurar nada más
```

### Paso 3: Inicializar Base de Datos

```bash
# Ejecutar el push del schema a MySQL
bun run db:push

# Esto creará las 15 tablas en la base de datos MySQL
# También generará el cliente de Prisma
```

### Paso 4: Crear Usuarios de Prueba

```bash
# Abrir el navegador y visitar:
# http://localhost:3000/api/setup/test-users

# Esto creará 4 usuarios de prueba automáticamente
```

### Paso 5: Iniciar el Servidor de Desarrollo

```bash
# El servidor ya corre automáticamente en el puerto 3000
# Puedes verificar con:
bun run dev

# O revisar el log:
cat /home/z/my-project/dev.log
```

### Paso 6: Iniciar el Servicio de WebSocket (Ubicación)

```bash
# Navegar al servicio de ubicación
cd /home/z/my-project/mini-services/location-service

# Iniciar el servicio en puerto 3001
bun run dev

# Este servicio debe correr en una terminal separada
```

### Paso 7: Probar la Aplicación

```bash
# Abrir el navegador en:
http://localhost:3000

# Usar los códigos de prueba:
# ADMIN001 - Administrador
# GERENTE002 - Gerente
# OBRERO003 - Trabajador
# SUPERVISOR004 - Supervisor
```

---

## ☁️ INSTRUCCIONES DE IMPLEMENTACIÓN EN SERVIDOR ONLINE

### Opción 1: Vercel (Recomendado)

#### Paso 1: Preparar el Proyecto

```bash
# Instalar Vercel CLI
bun add -g vercel

# Compilar la aplicación
bun run build
```

#### Paso 2: Configurar Base de Datos

```bash
# Vercel no tiene MySQL nativo
# Opciones:
# 1. Usar PlanetScale (MySQL Serverless)
# 2. Usar Neon (PostgreSQL - requiere migración del schema)
# 3. Usar Railway (MySQL con persistencia)

# Ejemplo con PlanetScale:
# 1. Crear cuenta en planetscale.com
# 2. Crear base de datos MySQL
# 3. Obtener DATABASE_URL
# 4. Actualizar Variables de Entorno en Vercel
```

#### Paso 3: Desplegar

```bash
# Desplegar en Vercel
vercel deploy

# Configurar durante el despliegue:
# - Framework Preset: Next.js
# - Root Directory: .
# - Build Command: bun run build
# - Output Directory: .next
```

### Opción 2: Railway

#### Paso 1: Crear Proyecto en Railway

```bash
# 1. Crear cuenta en railway.app
# 2. Crear nuevo proyecto
# 3. Seleccionar plantilla: Node.js
# 4. Elegir región
```

#### Paso 2: Agregar Base de Datos MySQL

```bash
# 1. Ir a la sección Databases
# 2. Agregar nueva base de datos
# 3. Seleccionar MySQL
# 4. Seleccionar versión 8.0
# 5. Seleccionar plan gratuito o de pago
```

#### Paso 3: Configurar Variables de Entorno

```bash
# En Railway, agregar las siguientes variables:
DATABASE_URL=<tu_database_url_from_railway>
NODE_ENV=production

# No incluir archivos .env en el deploy
```

#### Paso 4: Desplegar

```bash
# 1. Conectar repositorio de GitHub
# 2. Railway detectará automáticamente Next.js
# 3. Hacer click en "Deploy"
# 4. Esperar el despliegue
```

### Opción 3: DigitalOcean App Platform

#### Paso 1: Crear Droplet y Base de Datos

```bash
# 1. Crear Droplet con Ubuntu 22.04
# 2. Seleccionar plan (al menos $4/mes para producción)
# 3. Agregar SSH Keys
```

#### Paso 2: Instalar Dependencias en el Servidor

```bash
# Conectar via SSH
ssh root@tu-ip

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Instalar Bun
curl -fsSL https://bun.sh/install | bash

# Instalar Nginx
apt install -y nginx

# Clonar repositorio
git clone tu-repositorio
cd tu-repositorio
bun install
bun run build
```

#### Paso 3: Configurar Nginx

```bash
# Crear configuración de Nginx
nano /etc/nginx/sites-available/default

# Contenido:
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/constructora-pro/.next;

    location / {
        try_files $uri $uri/ /index.html $uri @nextjs = $uri @nextjs/index.html;
        proxy_pass http://localhost:3000;
    }

    location /ws/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Habilitar sitio
ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

# Probar configuración
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

#### Paso 4: Crear Servicios Systemd

```bash
# Crear servicio para Next.js
nano /etc/systemd/system/constructora-pro.service

[Unit]
Description=CODISPRO - Next.js App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/constructora-pro
ExecStart=/usr/bin/bun run dev
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target

# Crear servicio para WebSocket de Ubicación
nano /etc/systemd/system/constructora-location.service

[Unit]
Description=CODISPRO - Location Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/constructora-pro/mini-services/location-service
ExecStart=/usr/bin/bun run dev
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target

# Habilitar servicios
systemctl enable constructora-pro
systemctl enable constructora-location

# Iniciar servicios
systemctl start constructora-pro
systemctl start constructora-location

# Verificar estado
systemctl status constructora-pro
systemctl status constructora-location
```

---

## 🔧 CONFIGURACIÓN DE LA BASE DE DATOS

### Estructura de Tablas

El sistema utiliza 15 tablas principales:

1. **User** - Usuarios del sistema
2. **Worker** - Trabajadores
3. **Tool** - Herramientas
4. **ToolLoan** - Préstamos de herramientas
5. **Vehicle** - Vehículos
6. **VehicleTrip** - Viajes de vehículos
7. **VehicleSparePart** - Repuestos de vehículos
8. **Shipment** - Envíos de materiales
9. **PettyCash** - Movimientos de caja chica
10. **Project** - Proyectos
11. **ProjectStaff** - Personal por proyecto
12. **ProjectExpense** - Gastos por proyecto
13. **PayrollEntry** - Planilla
14. **LocationLog** - Registro de ubicaciones
15. **Notification** - Notificaciones (opcional)

### Query SQL Manual

```sql
-- Ver todos los usuarios
SELECT * FROM User;

-- Ver trabajadores activos
SELECT * FROM Worker WHERE isActive = true;

-- Ver herramientas con préstamos activos
SELECT t.*, tl.loanDate, tl.returnDate, w.firstName, w.lastName
FROM Tool t
LEFT JOIN ToolLoan tl ON t.id = tl.toolId AND tl.returnDate IS NULL
LEFT JOIN Worker w ON tl.workerId = w.id;

-- Ver vehículos disponibles
SELECT * FROM Vehicle WHERE isActive = true AND status = 'available';

-- Ver envíos pendientes
SELECT s.*, v.name as vehicleName, v.plate, p.name as projectName
FROM Shipment s
LEFT JOIN Vehicle v ON s.vehicleId = v.id
LEFT JOIN Project p ON s.projectId = p.id
WHERE s.status IN ('pending', 'sent');

-- Balance de caja chica
SELECT
    type,
    SUM(amount) as total
FROM PettyCash
GROUP BY type;

-- Progreso de proyectos
SELECT name, progress, budget, status
FROM Project
ORDER BY createdAt DESC;

-- Ubicaciones recientes (últimas 24 horas)
SELECT l.*, u.name as userName
FROM LocationLog l
JOIN User u ON l.userId = u.id
WHERE l.timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY l.timestamp DESC;
```

---

## 📱 PWA - INSTALACIÓN EN DISPOSITIVOS

### iOS

```bash
# 1. Abrir Safari en iPhone/iPad
# 2. Visitar http://localhost:3000
# 3. Tocar el botón "Compartir"
# 4. Seleccionar "Agregar a pantalla de inicio"
# 5. Ajustar la vista y tocar "Agregar"
```

### Android

```bash
# 1. Abrir Chrome en Android
# 2. Visitar http://localhost:3000
# 3. Tocar el menú (tres puntos)
# 4. Seleccionar "Agregar a pantalla de inicio"
# 5. Aceptar y confirmar
```

---

## 🔧 MANTENIMIENTO

### Comandos Útiles

```bash
# Verificar estado del servidor de ubicación
cd mini-services/location-service
bun run dev

# Ver logs de desarrollo
cat /home/z/my-project/dev.log

# Verificar que el servicio esté corriendo
curl http://localhost:3001

# Actualizar Prisma
bun run db:generate

# Lint para verificar código
bun run lint

# Crear nuevo usuario
# (Manual en la base de datos)
INSERT INTO User (code, name, role, isActive, createdAt, updatedAt)
VALUES ('NUEVO001', 'Nuevo Usuario', 'worker', true, NOW(), NOW());
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Cannot connect to database"

```bash
# 1. Verificar .env
cat .env

# 2. Verificar que DATABASE_URL sea correcta
# 3. Probar conexión manualmente
mysql -h bkzonlznatzzfkelstum-mysql.services.clever-cloud.com -u us1c5wbm2waphqnm -p

# 4. Verificar que el puerto 3306 no esté bloqueado
# 5. Contactar a Clever Cloud para verificar estado
```

### Error: "Prisma Client not generated"

```bash
# Regenerar cliente de Prisma
bun run db:generate

# Si falla, limpiar y repetir
rm -rf node_modules/.prisma
bun run db:generate
```

### Error: "WebSocket connection failed"

```bash
# 1. Verificar que el servicio de ubicación esté corriendo
curl http://localhost:3001

# 2. Reiniciar el servicio si es necesario
cd mini-services/location-service
bun run dev

# 3. Verificar que el puerto 3001 no esté en uso
lsof -i :3001
```

---

## 📊 ANÁLISIS Y REPORTES

### Métricas Disponibles en el Dashboard

1. **Trabajadores Totales** - Cantidad de personal activo
2. **Herramientas** - Disponibles vs En Uso
3. **Vehículos** - Total flota y disponibilidad
4. **Proyectos** - Total y por estado
5. **Envíos** - Totales y discrepancias
6. **Caja Chica** - Ingresos, Egresos, Balance

### Gráficos Disponibles

1. **Gráfico Circular** - Estado de herramientas
2. **Gráfico de Barras** - Proyectos por estado
3. **Tarjeta de Balance** - Resumen financiero

---

## 🔐 SEGURIDAD

### Recomendaciones

1. **HTTPS obligatorio en producción**
2. **Cambiar códigos de prueba después del primer despliegue**
3. **Implementar rate limiting en la API**
4. **Sanitizar todas las entradas de usuario**
5. **Usar variables de entorno para credenciales**
6. **Implementar logging para auditoría**
7. **Backup automáticos diarios**

### Roles de Usuario

- **admin**: Acceso total al sistema
- **manager**: Gestión completa de todos los módulos
- **worker**: Acceso limitado a módulos operativos

---

## 📞 SOPORTE Y CONTACTO

Para reportar problemas o solicitar ayuda, documentar:

1. **Versión de la aplicación**: 1.0.0
2. **Navegador y versión**
3. **Capturas de pantalla del error**
4. **Pasos reproducidos**
5. **Logs de la consola del navegador**
6. **Logs del servidor**: `cat /home/z/my-project/dev.log`

---

## ✅ CHECKLIST ANTES DE IR A PRODUCCIÓN

- [ ] Todos los módulos probados y funcionando
- [ ] Sistema de autenticación probado con todos los roles
- [ ] Códigos de prueba eliminados y códigos reales creados
- [ ] Backup y restauración probado
- [ ] Exportación PDF e Excel probadas
- [ ] Calendario integrado funcional
- [ ] Sistema de ubicación probado
- [ ] Responsive design verificado en móvil
- [ ] PWA instalado en dispositivos iOS y Android
- [ ] Caja chica calculando balance correctamente
- [ ] Discrepancias en envíos detectando correctamente
- [ ] Proyectos con progreso actualizable
- [ ] WebSocket de ubicación estable
- [ ] HTTPS configurado en producción
- [ ] Variables de entorno seguras
- [ ] Backup automático configurado

---

## 🎓 GUÍA DE USO RÁPIDA

### Primeros Pasos

1. **Ingresar** con código `ADMIN001`
2. **Crear trabajadores** en el módulo de Trabajadores
3. **Crear herramientas** en el módulo de Herramientas
4. **Crear vehículos** en el módulo de Vehículos
5. **Crear un proyecto** en el módulo de Proyectos
6. **Probar el módulo de envíos** con un envío de prueba
7. **Probar la caja chica** con un ingreso y un egreso
8. **Ver el calendario integrado** con todas las actividades

### Funcionalidades Avanzadas

1. **Calendario** - Ve todos los eventos en una vista unificada
2. **Exportar a PDF** - Genera reportes profesionales
3. **Exportar a Excel** - Descarga datos para análisis
4. **Backup** - Crea copia de seguridad completa
5. **Ubicación** - Prueba el tracking en tiempo real

---

## 🏆 CONCLUSIÓN

Sistema completado con:
- ✅ 8 módulos completos
- ✅ Dashboard avanzado con KPIs
- ✅ Sistema de ubicación en tiempo real
- ✅ PWA con soporte offline
- ✅ Calendario integrado global
- ✅ Exportación a PDF y Excel
- ✅ Sistema de backup y restauración
- ✅ Notificaciones inteligentes
- ✅ Diseño responsivo y accesible

¡La aplicación está lista para producción! 🎉
