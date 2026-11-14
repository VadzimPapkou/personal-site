# Resume Website

Сайт-визитка на Next.js с темой GitHub Primer (светлая тема `@primer/primitives`).

## Стек

- Next.js (App Router, static export)
- React
- TypeScript
- `@primer/primitives` — официальные токены темы GitHub

## Установка

```bash
npm install
```

## Разработка

```bash
npm run dev
```

## Сборка

```bash
npm run build
```

Статика попадает в `out/` (`/` — RU, `/en/` — EN). После `next build` скрипт `build:pdf` собирает ATS-friendly PDF из `src/data/*.json` через Playwright (`vadim-popkov-ru.pdf` / `vadim-popkov-en.pdf` в `out/` и `public/`).

## Деплой

GitHub Pages через Actions: каждый push в `main`/`master` собирает проект и выкладывает `out/`.
