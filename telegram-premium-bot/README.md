# Telegram Premium Bot

Un bot premium de Telegram con sistema de herramientas, gestión de comunidad, asistente de IA y panel de administración.

## Características

- **Directorio de Herramientas**: Gestión completa de herramientas de desarrollo (CRUD)
- **Perfiles y Sitios Web**: Visualización de proyectos y perfiles
- **Búsqueda de Herramientas**: Sistema de búsqueda integrado
- **Asistente de IA**: Integración con APIs de OpenAI (chat, resumen, traducción)
- **Sistema de Bienvenida**: Automatización de mensajes en grupos
- **Panel de Administración**: Control completo vía Telegram
- **Gestión de Descargas**: Sistema de descargas con links múltiples
- **Publicidad**: Sistema de administración de anuncios
- **Módulo de Moderación**: Anti-spam, protección anti-flood, filtrado de enlaces
- **Base de Datos Escalable**: Arquitectura lista para SQLite/PostgreSQL

## Requisitos

- Node.js >= 18.0.0
- npm o yarn
- Token de bot de Telegram (obtenido de @BotFather)
- API Key de OpenAI (para funciones de IA)

## Instalación

1. Clona el repositorio
2. Copia el archivo de entorno:
   ```bash
   cp .env.example .env
   ```
3. Edita `.env` con tus credenciales:
   ```
   BOT_TOKEN=tu_token_de_bot
   OWNER_ID=tu_id_de_telegram
   AI_API_KEY=tu_api_key_de_openai
   ```
4. Instala las dependencias:
   ```bash
   npm install
   ```
5. Inicia el bot:
   ```bash
   npm start
   ```

## Configuración del Bot

1. Crea un bot en Telegram hablando con @BotFather
2. Obtén tu token y configúralo en `.env`
3. Configura tu USER_ID como `OWNER_ID` en `.env`

## Comandos Disponibles

### Para Usuarios
- `/start` - Inicio del bot
- `/help` - Ayuda general
- `/profile` - Ver perfil del desarrollador
- `/about` - Información sobre el bot
- `/tools` - Ver todas las herramientas
- `/websites` - Ver sitios web y proyectos
- `/search <keyword>` - Buscar herramientas
- `/rules` - Ver reglas del grupo
- `/ai <pregunta>` - Preguntar al asistente de IA
- `/summarize <texto>` - Resumir texto con IA
- `/translate <texto> <idioma>` - Traducir texto

### Para Administradores (Solo Owner)
- `/admin` - Panel de administración
- `/addtool` - Agregar nueva herramienta
- `/listtools` - Lista de todas las herramientas
- `/settings` - Configuración del bot

## Estructura del Proyecto

```
telegram-premium-bot/
├── src/
│   ├── config/           # Configuración centralizada
│   ├── commands/         # Handlers de comandos
│   ├── handlers/         # Manejadores de eventos
│   ├── middleware/       # Middleware (autenticación, rate limit)
│   ├── services/         # Servicios de negocio
│   ├── database/         # Capa de datos
│   ├── keyboards/        # Teclados inline
│   └── utils/            # Utilidades
├── data/                 # Archivos JSON de datos
├── admin-panel/          # Panel de administración (Mini App)
├── logs/                 # Logs de ejecución
├── .env.example          # Ejemplo de variables de entorno
├── .gitignore
└── package.json
```

## Configuración de Datos

Los datos se almacenan en archivos JSON dentro de la carpeta `data/`:

- `tools.json` - Catálogo de herramientas
- `profile.json` - Información del perfil
- `websites.json` - Sitios web y proyectos
- `settings.json` - Configuración general
- `stats.json` - Estadísticas de uso

## Módulo de Publicidad

El sistema de publicidad permite:
- Crear campañas publicitarias
- Mostrar ads antes de descargas
- Control de frecuencia de anuncios
- Múltiples proveedores de publicidad

## Panel de Administración (Mini App)

El panel de administración se construye como una Telegram Mini App con:
- Dashboard interactivo
- Gráficos y estadísticas
- CRUD completo de herramientas
- Gestión de usuarios
- Configuración avanzada

## Consideraciones de Seguridad

- Las credenciales sensibles nunca deben硬-codearse en el código
- Usa `.env` para todas las configuraciones sensibles
- El archivo `.env` está excluido de `.gitignore`
- Solo el owner puede acceder a comandos administrativos
- Validación de entrada en todos los comandos

## Problemas Comunes

**Error: BOT_TOKEN no configurado**
- Asegúrate de tener un archivo `.env` con tu token válido

**Error: AI_API_KEY no configurada**
- Configura tu API key de OpenAI en `.env`

**Comandos no responden**
- Verifica que el bot tenga los permisos adecuados en el grupo
- Asegúrate de que el bot esté agregado como administrador si necesitas funciones de grupo

## Despliegue

Para despliegue en producción:
1. Configura las variables de entorno en tu servidor
2. Usa PM2 para mantener el proceso activo:
   ```bash
   npm install -g pm2
   pm2 start npm --name "telegram-bot" -- start
   pm2 save
   ```
3. Configura HTTPS para el panel de administración

## Contribuir

Las contribuciones son bienvenidas. Por favor sigue estos pasos:
1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## Licencia

MIT License - ver archivo LICENSE para más detalles.
