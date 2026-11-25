# Despliegue en el VPS — primera puesta en marcha

Runbook para llevar el backend NestJS (este repositorio) y el frontend Angular
(repo `Drugstore`) a un VPS con **Ubuntu 24.04**, con **systemd nativo + Caddy**
(sin Docker), PostgreSQL **en Railway** y despliegue automático desde GitHub
Actions con un push a `main`.

Modelo de tráfico (un solo dominio):

```
internet ──HTTPS 443──▶ Caddy ──/api/* (sin prefijo)──▶ backend NestJS  127.0.0.1:3000
                              └──/ (resto)─────────────▶ frontend SSR   127.0.0.1:4000
```

Comandos del backend: correr salvo indicación desde la raíz de **este repositorio**
(la carpeta `backend/` vive dentro).

---

## 1. Usuario de despliegue y directorios

El mismo usuario `drogueria` corre el servicio y recibe las conexiones SSH del
pipeline (así la llave de GitHub solo puede escribir donde corre la app):

```bash
sudo useradd --system --create-home --shell /bin/bash drogueria
sudo mkdir -p /srv/drogueria /etc/drogueria
sudo chown drogueria:drogueria /srv/drogueria
```

- `/srv/drogueria/backend` — el código que llega por rsync (se crea solo, en el
  primer deploy; si preferís anticiparlo: `sudo mkdir -p` + `chown drogueria:drogueria`).
- `/etc/drogueria/backend.env` — variables de **runtime** del backend (ver §6).

## 2. Node 22 y Caddy

Node 22 desde NodeSource (queda en `/usr/bin/node`, que es la ruta del `ExecStart`):

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v    # v22.x
```

> El `.nvmrc` del repo (`22`) fija la versión para CI y para quien clona el
> proyecto con nvm; en el VPS se instala Node del sistema, no nvm.

Caddy (repositorio oficial):

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
caddy version
```

## 3. Firewall: los puertos de la app no salen a internet

El frontend y el backend escuchan en `127.0.0.1` **vía firewall**, no via código:
`app.listen` del backend no fija host (NestJS escucha en todas las interfaces) y
tocar `main.ts` es un cambio de comportamiento que el despliegue no requiere.
Con ufw, el firewall no invalida el loopback:

```bash
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp      # Caddy (HTTP redirige a HTTPS, TLS automático)
sudo ufw enable
sudo ufw status verbose
```

## 4. Llave SSH dedicada y secretos de GitHub

Generar el par **una vez**, en tu máquina (no en el VPS):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/drogueria_despliegue -N "" -C "deploy drogueria-backend"
```

Instalar la pública en el VPS:

```bash
cat ~/.ssh/drogueria_despliegue.pub | ssh usuario-admin@VPS_HOST \
  'sudo install -d -o drogueria -g drogueria -m 700 /home/drogueria/.ssh && \
   sudo tee /home/drogueria/.ssh/authorized_keys && \
   sudo chmod 600 /home/drogueria/.ssh/authorized_keys && \
   sudo chown drogueria:drogueria /home/drogueria/.ssh/authorized_keys'
```

Capturar el host key del VPS para pinearlo (correrlo desde una máquina
confiable y preferentemente por primera vez estando en la red de confianza):

```bash
ssh-keyscan -p 22 VPS_HOST   # copiar la salida de las líneas del tipo de clave
```

En GitHub: *Settings → Secrets and variables → Actions*, en este repo:

| Nombre | Tipo | Valor |
| --- | --- | --- |
| `VPS_HOST` | secret | dominio o IP del VPS |
| `VPS_USER` | secret | `drogueria` |
| `VPS_SSH_KEY` | secret | contenido completo de `~/.ssh/drogueria_despliegue` (la **privada**) |
| `VPS_KNOWN_HOSTS` | secret | salida de `ssh-keyscan` del paso anterior |
| `DEPLOY_ENABLED` | **variable** | se deja vacío; se llena con `true` solo cuando el VPS ya existe (§9) |

El pipeline usa `StrictHostKeyChecking=yes` con ese `known_hosts`: si el host
key del VPS cambia, el deploy falla en vez de confiar a ciegas.

## 5. Regla de sudoers (única y angosta)

El job remoto necesita exactamente dos acciones con permisos de root:

```bash
echo 'drogueria ALL=(root) NOPASSWD: /usr/bin/systemctl restart drogueria-backend, /usr/bin/journalctl -u drogueria-backend -n * --no-pager' \
  | sudo tee /etc/sudoers.d/drogueria-backend
sudo chmod 440 /etc/sudoers.d/drogueria-backend
sudo visudo -c -f /etc/sudoers.d/drogueria-backend   # debe decir "parsed OK"
```

Es tan angosta por diseño: permite reiniciar **solo ese servicio** y leer
**solo su journal**, sin `-r` en `systemctl`, sin otros servicios, sin shell
root. No alcanza para instalar paquetes, ni tocar la base, ni editar archivos.

El repositorio del frontend necesita su propia regla, análoga y también angosta
(`drogueria-frontend` en lugar de `drogueria-backend`). Está descrita en
`deploy/DESPLIEGUE.md` de `Drugstore`; si se monta el VPS siguiendo solo este
documento, el deploy del frontend va a fallar en el `systemctl restart`.

## 6. `/etc/drogueria/backend.env` (permisos y contenido)

```bash
sudo install -o drogueria -g drogueria -m 600 /dev/null /etc/drogueria/backend.env
sudoedit /etc/drogueria/backend.env   # pega la plantilla y completa valores
```

Plantilla (**nombres solamente**; los valores reales van en el VPS, nunca en el
repo). Los nombres son los de `backend/env.example`:

```
DATABASE_URL="postgresql://usuario:contrasena@host:5432/base?sslmode=require"
JWT_SECRET="openssl-rand-base64-48"
JWT_EXPIRES_IN=3600
PORT=3000
CORS_ORIGIN=https://tu-dominio.com
ADMIN_USUARIO=admin
ADMIN_CORREO=admin@drogueriapili.com
ADMIN_CONTRASENA="clave-del-admin-en-caso-de-recrearla"
ADMIN_RESET=0
```

- Permisos `600` con dueño `drogueria`: la app puede leerlo (systemd se lo
  inyecta antes de arrancar) y nadie más del sistema.
- `NODE_ENV` no va acá: lo fija la unidad de systemd (`Environment=NODE_ENV=production`).
- Con frontend y backend en el mismo origen, `CORS_ORIGIN` es preventivo (el
  navegador nunca hace cross-origin en producción).
- La app lee estas variables pero **no** un `.env`: `dotenv` no sobrescribe
  variables que ya están en el entorno (solo completa los huecos en desarrollo),
  y el `.env` ni siquiera llega al VPS (lo excluye el rsync).

## 7. Instalar unidad de systemd, Caddyfile y validar

```bash
sudo install -m 644 deploy/drogueria-backend.service /etc/systemd/system/
sudo systemctl daemon-reload

sudo install -m 644 deploy/Caddyfile /etc/caddy/Caddyfile
sudo mkdir -p /var/log/caddy
sudo chown caddy:caddy /var/log/caddy
```

Validar el Caddyfile **con `{$DOMINIO}` definida** (si falta, la validación
falla por dominio vacío, que es la prueba de que la variable se exigida):

```bash
sudo DOMINIO=tu-dominio.com caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
# debe responder: Valid configuration
```

Y dejar el dominio en el arranque del servicio de Caddy (el paquete de Debian
lee `/etc/default/caddy`):

```
# /etc/default/caddy
DOMINIO=tu-dominio.com
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now caddy
```

El registro de accesos queda en `/var/log/caddy/drogueria-access.log` (JSON).

> Requisito previo: el DNS del dominio apuntando a la IP del VPS, para que
> Caddy pida el certificado TLS automáticamente (ACME).

## 8. Primer arranque manual (una sola vez)

Primero la base: la base de Railway ya tiene sus tablas y el historial viejo de
migraciones, así que hay que **baselinarla una única vez** (si se salta este
paso, el primer deploy intenta crear tablas que ya existen):

```bash
cd backend
# con DATABASE_URL apuntando a Railway exportado en el entorno:
npx prisma migrate resolve --applied 20261124182455_init_proyecto10
npx prisma migrate status     # debe decir "Database schema is up to date!"
```

Después, popuiar el VPS y arrancar:

```bash
# desde tu máquina, misma sincronización que hace el pipeline:
rsync -az --delete \
  --exclude node_modules/ --exclude dist/ --exclude .env \
  --exclude generated/ --exclude coverage/ \
  backend/ drogueria@VPS_HOST:/srv/drogueria/backend/

ssh drogueria@VPS_HOST
  cd /srv/drogueria/backend
  set -a; . /etc/drogueria/backend.env; set +a
  npm ci
  npx prisma generate
  npm run build
  npx prisma migrate deploy   # con la base baselinada: "No pending migrations"
  sudo systemctl enable --now drogueria-backend
  exit
```

Verificación de las dos rutas (el backend responde `{"status":"ok",...}`):

```bash
curl -i https://tu-dominio.com/          # frontend Angular
curl -i https://tu-dominio.com/api       # backend, con el prefijo /api quitado
curl -i http://127.0.0.1:3000/           # en el VPS: salud directa del backend
curl -I https://tu-dominio.com/ | grep -iE "strict-transport|x-content|referrer|server"
```

Cuando quede todo verde, se define la **variable** de repositorio
`DEPLOY_ENABLED=true` (§4) y desde ahí cada push a `main` despliega solo.
`DEPLOY_ENABLED=false` (o vacío) apaga el job de deploy sin borrar nada.

## 9. Rollback

**Por la interfaz de Actions (preferido):** *Actions → CI/CD backend → elegir
un run anterior de `main` cuyo commit sea el bueno → Re-run failed jobs* (o
re-run de `desplegar`). El rsync es `--delete`, así que deja el árbol del VPS
idéntico al de ese commit; si no hubo migraciones nuevas, `migrate deploy`
responde "No pending migrations to apply" y no toca la base.

**Manual (variante `git reset --hard`):** sobre un clon fresco (nunca sobre
tu árbol de trabajo: `reset --hard` descarta cambios locales):

```bash
git clone git@github.com:laura210610/drogueria-backend.git $(mktemp -d)/drogueria
cd .../drogueria-backend && git reset --hard <sha-del-buen-commit>
# y repetir el bloque manual de §8: rsync + build + migrate deploy + restart
```

**Si una migración ya corrió:** Prisma es **forward-only**: no deshacer DDL a
mano ni re-migrar "hacia atrás"; `_prisma_migrations` ya registró el avance y
una versión anterior del código no lo retrotrae. Si el código viejo no tolera
la tabla nueva, la corrección se escribe como **una migración nueva** que
compense el cambio, no como rollback del estado de la base. Solo chequear con
`npx prisma migrate status` (con la `DATABASE_URL` de Railway) que la base y
el código queden coherentes.

## 10. Variables de entorno: build vs. runtime

| Variable | Cuándo | Dónde vive | Cómo se aplica |
| --- | --- | --- | --- |
| `apiUrl` (frontend) | **build** | `environment.prod.ts` del repo `Drugstore` | queda incrustada en el bundle de producción; cambiarla exige recompilar y redesplegar el frontend (ver T1: en producción ya es `/api`, no un host) |
| `DATABASE_URL`, `JWT_SECRET`, etc. (backend) | **runtime** | `/etc/drogueria/backend.env` en el VPS | `sudoedit` + `sudo systemctl restart drogueria-backend`; no recompila nada |

⚠️ **Cambiar `JWT_SECRET` invalida todos los tokens emitidos con la anterior:
todos los usuarios quedan deslogueados.** Con `JWT_EXPIRES_IN` corto (3600 s)
el impacto es menor, pero avisa.

---

## Lo que este runbook no puede probar sin el VPS

Montaje en vivo con este documento no probado aún: usuario, directorios,
Node y Caddy instalados por APT, la clave ssh-keyscanizada contra tu host real,
la validación de Caddy con tu `DOMINIO`, el primer arranque manual, la ruta a
`/` y `/api` contra HTTPS real y el rollback contra la base de producción son
pasos de servidor no verificados aquí: el repo solo llevaba los artefactos
(unidad systemd, Caddyfile, workflow) probados en su propio terreno — parseo de
YAML, `caddy validate`, `systemd-analyze verify` — que están reportados en la
tarea T6. La validación end-to-end es T7.
