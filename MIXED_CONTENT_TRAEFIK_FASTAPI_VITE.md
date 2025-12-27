# Mixed Content (HTTPS page → HTTP requests): what happened and how to avoid it

This document captures **two real production issues** we hit on `ams.it-uae.com` and the **exact fixes**.

## 1) Vite `dist/assets` conflicts with React route `/assets`

### Symptom
- Opening `https://<domain>/assets` causes redirects to `http://<domain>:3000/assets/`
- Browser shows Mixed Content errors

### Root cause
Vite builds static files into `dist/assets` by default.  
If your React Router has a page route **`/assets`**, then inside the frontend container Nginx sees:
- `/usr/share/nginx/html/assets` as a real directory
- Requests to `/assets` can trigger a redirect to `/assets/`
- In our case the redirect location became an absolute **HTTP** URL (Mixed Content).

### Fix
Move Vite build assets directory away from `/assets`.

We changed `frontend/vite.config.ts`:
- `build.assetsDir: 'static'`

After build, the HTML points to `/static/...` instead of `/assets/...`.

## 2) FastAPI/Uvicorn redirects were generated as `http://...` behind Traefik

### Symptom
Frontend calls:
- `https://<domain>/api/v1/assets?search=&limit=100`

Backend responded:
- `HTTP 307` with `Location: http://<domain>/api/v1/assets/?...`

Browser blocks it as Mixed Content because the redirect forces HTTP.

### Root cause
Starlette/FastAPI generates redirects (e.g., adding a trailing slash) based on the request scheme.
Behind a reverse proxy (Traefik), the real scheme is provided via headers like:
- `X-Forwarded-Proto: https`

If Uvicorn does **not** trust proxy headers, it thinks the scheme is `http` and builds redirect URLs with `http://...`.

### Fix
Run Uvicorn with proxy headers enabled (and allow Traefik IPs):

- `--proxy-headers`
- `--forwarded-allow-ips=*`

We applied this in `docker-compose.prod.yml` for the `backend` service command.

### Quick verification
Run:

- `curl -sv 'https://<domain>/api/v1/assets?search=&limit=1' 2>&1 | grep -i location`

Expected **after fix**:
- `Location: https://<domain>/api/v1/assets/?...`

## Recommended checklist for new projects

- **Avoid route collisions**: do not use React routes that match your static folder name (`/assets` is the common one).
  - Prefer Vite `assetsDir: 'static'` (or any non-route prefix).
- **If behind Traefik/Nginx/Cloudflare**:
  - Enable Uvicorn `--proxy-headers`
  - Set `--forwarded-allow-ips=*` (or restrict to your proxy IPs)
- **When you see Mixed Content**:
  - Check if the response is a **redirect** to `http://...` (Network tab → Response Headers → Location).


