# Installation Guide

## Prerequisites

- Node.js and npm
- MySQL (for Prisma `DATABASE_URL` and `SHADOW_DATABASE_URL`)
- Network access on first API install: `postinstall` runs `npx puppeteer browsers install chrome` (needed for Puppeteer/PDF features)

---

## 1. Clone

```bash
git clone https://github.com/aju-alen/AnalyticaForm.git
cd AnalyticaForm
```

---

## 2. API (`api/`)

```bash
cd api
npm install
```

`npm install` triggers the Puppeteer Chrome browser install via `postinstall`.

Copy the sample env and fill in your values:

```bash
cp sample.env .env
```

This API uses Prisma with MySQL. Ensure `DATABASE_URL` and `SHADOW_DATABASE_URL` are set in `.env`, then generate the Prisma client:

```bash
npx prisma generate
```

If you need a fresh database schema, run migrations as appropriate for your environment (`npx prisma migrate deploy` or `npx prisma migrate dev`).

Start the server:

```bash
npm run dev
```

The API defaults to port `3001` unless `PORT` is set in `.env`.

---

## 3. Client (`client/`)

```bash
cd client
npm install
```

Copy the sample env and fill in your values:

```bash
cp sample.env .env
```

For local development, set `VITE_BACKEND_URL` to your local API (for example `http://localhost:3001`).

Start the Vite dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Optional production-like local serve:

```bash
npm run build
npm run preview
```

---

## 4. DRI page (`dri-page/`)

```bash
cd dri-page
npm install
```

Copy the sample env and fill in your values:

```bash
cp sample.env .env
```

For local development, set `VITE_API_BASE_URL_DRI` to your local API (for example `http://localhost:3001`). If unset, the app falls back to `http://localhost:3001` in code.

Start the Vite dev server:

```bash
npm run dev
```

Vite defaults to port `5173`. If the main `client/` app is already using `5173`, this process will take the next free port (check the terminal output), or start it with an explicit port, for example:

```bash
npx vite --port 5174
```

---

## 5. Typical local start order

1. Start the API (`api/` → `npm run dev`)
2. Start the client (`client/` → `npm run dev`)
3. Start the DRI page when working on DRI flows (`dri-page/` → `npm run dev`)
