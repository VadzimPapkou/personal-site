import { readFile } from "node:fs/promises";
import { mkdir, copyFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dayjs from "dayjs";
import "dayjs/locale/en.js";
import "dayjs/locale/ru.js";
import { chromium } from "playwright";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(__dirname, "..");
const publicDir = join(root, "public");
const outDir = join(root, "out");

const targets = [
  { lang: "ru", dataFile: "ru.json", file: "vadim-popkov-ru.pdf" },
  { lang: "en", dataFile: "en.json", file: "vadim-popkov-en.pdf" },
];

function formatPeriod(startDate, endDate, lang) {
  dayjs.locale(lang);
  const start = dayjs(startDate);
  const end = endDate ? dayjs(endDate) : dayjs();

  let startFormatted = start.format("MMM YYYY");
  let endFormatted = endDate
    ? end.format("MMM YYYY")
    : lang === "ru"
      ? "настоящее время"
      : "Present";

  if (lang === "ru") {
    startFormatted =
      startFormatted.charAt(0).toUpperCase() + startFormatted.slice(1);
    if (endDate) {
      endFormatted =
        endFormatted.charAt(0).toUpperCase() + endFormatted.slice(1);
    }
  }

  return `${startFormatted} – ${endFormatted}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function contactLine(t) {
  const websiteLabel = t.website.replace(/^https?:\/\//, "");
  return [
    escapeHtml(t.email),
    escapeHtml(t.phone),
    escapeHtml(t.location),
    `@${escapeHtml(t.telegram)}`,
    escapeHtml(websiteLabel),
  ].join(" · ");
}

function buildResumeHtml(t, lang) {
  const experienceItems = t.experience
    .map((item) => {
      const bullets = (item.achievements ?? [])
        .map((achievement) => {
          const text = achievement.result
            ? `${achievement.action}, ${achievement.result}`
            : achievement.action;
          return `<li>${escapeHtml(text)}</li>`;
        })
        .join("");

      const companyUrl = item.url
        ? item.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
        : "";
      const companyHeading = companyUrl
        ? `${escapeHtml(item.company)} · ${escapeHtml(companyUrl)}`
        : escapeHtml(item.company);

      return `
        <article class="role">
          <h3>${companyHeading}</h3>
          <p class="role__position">${escapeHtml(item.position)}</p>
          <p class="role__meta">${escapeHtml(formatPeriod(item.startDate, item.endDate, lang))} · ${escapeHtml(item.location)}</p>
          <p class="role__description">${escapeHtml(item.description)}</p>
          ${bullets ? `<ul>${bullets}</ul>` : ""}
        </article>
      `;
    })
    .join("");

  const skills = t.skills.list.map((skill) => escapeHtml(skill.name)).join(", ");

  const languages = `<p>${escapeHtml(t.languages.russian)} — ${escapeHtml(t.languages.russianLevel)} · ${escapeHtml(t.languages.english)} — ${escapeHtml(t.languages.englishLevel)}</p>`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(t.name)} — ${escapeHtml(t.title)}</title>
  <style>
    :root {
      --ink: #14213d;
      --text: #1f2937;
      --muted: #4b5563;
      --line: #d1d5db;
      --accent: #0f766e;
      --page: #ffffff;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--page);
      color: var(--text);
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .resume {
      width: 100%;
      max-width: 720px;
      margin: 0 auto;
      padding: 0;
    }

    header {
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--ink);
    }

    h1 {
      margin: 0 0 2px;
      color: var(--ink);
      font-size: 24pt;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.15;
    }

    .title {
      margin: 0 0 8px;
      color: var(--accent);
      font-size: 12pt;
      font-weight: 600;
    }

    .contacts {
      margin: 0;
      color: var(--muted);
      font-size: 9pt;
      line-height: 1.45;
    }

    section {
      margin: 0 0 12px;
    }

    h2 {
      margin: 0 0 8px;
      padding-bottom: 3px;
      color: var(--ink);
      font-size: 10.5pt;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      border-bottom: 1px solid var(--line);
    }

    .role {
      margin: 0 0 11px;
    }

    .role:last-child {
      margin-bottom: 0;
    }

    h3 {
      margin: 0 0 1px;
      color: var(--ink);
      font-size: 11pt;
      font-weight: 700;
    }

    .role__position {
      margin: 0 0 1px;
      color: var(--text);
      font-size: 10pt;
      font-weight: 600;
    }

    .role__meta {
      margin: 0 0 4px;
      color: var(--muted);
      font-size: 9pt;
    }

    .role__description {
      margin: 0 0 4px;
    }

    ul {
      margin: 0;
      padding: 0 0 0 16px;
    }

    li {
      margin: 0 0 3px;
    }

    li:last-child {
      margin-bottom: 0;
    }

    .skills, .languages p, .education p {
      margin: 0 0 2px;
    }

    .education h3 {
      margin-bottom: 1px;
    }

    .education .meta {
      color: var(--muted);
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <main class="resume">
    <header>
      <h1>${escapeHtml(t.name)}</h1>
      <p class="title">${escapeHtml(t.title)}</p>
      <p class="contacts">${contactLine(t)}</p>
    </header>

    <section>
      <h2>${escapeHtml(t.sections.experience)}</h2>
      ${experienceItems}
    </section>

    <section>
      <h2>${escapeHtml(t.sections.skills)}</h2>
      <p class="skills">${skills}</p>
    </section>

    <section class="education">
      <h2>${escapeHtml(t.sections.education)}</h2>
      <h3>${escapeHtml(t.education.university)}</h3>
      <p>${escapeHtml(t.education.degree)}</p>
      <p class="meta">${escapeHtml(formatPeriod(t.education.startDate, t.education.endDate, lang))}</p>
    </section>

    <section class="languages">
      <h2>${escapeHtml(t.sections.languages)}</h2>
      ${languages}
    </section>
  </main>
</body>
</html>`;
}

async function renderPdf(page, target, t) {
  const html = buildResumeHtml(t, target.lang);
  await page.setContent(html, { waitUntil: "networkidle" });

  const pdfPath = join(outDir, target.file);
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "14mm",
      right: "15mm",
      bottom: "14mm",
      left: "15mm",
    },
  });

  await copyFile(pdfPath, join(publicDir, target.file));
  console.log(`Generated ${target.file}`);
}

async function main() {
  await mkdir(publicDir, { recursive: true });
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    for (const target of targets) {
      const raw = await readFile(join(root, "src/data", target.dataFile), "utf8");
      const t = JSON.parse(raw);
      const page = await browser.newPage({
        viewport: { width: 900, height: 1200 },
        deviceScaleFactor: 2,
      });
      try {
        await renderPdf(page, target, t);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
