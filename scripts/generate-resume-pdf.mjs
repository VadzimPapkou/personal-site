import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { mkdir, copyFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(__dirname, "..");
const outDir = join(root, "out");
const publicDir = join(root, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

const targets = [
  { path: "/", lang: "ru", file: "vadim-popkov-ru.pdf" },
  { path: "/en/", lang: "en", file: "vadim-popkov-en.pdf" },
];

function startStaticServer(directory) {
  const server = createServer((req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith("/")) {
        pathname += "index.html";
      }

      const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
      const filePath = join(directory, safePath);

      if (
        !filePath.startsWith(directory) ||
        !existsSync(filePath) ||
        !statSync(filePath).isFile()
      ) {
        res.writeHead(404).end("Not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      });
      createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(500).end("Server error");
    }
  });

  return new Promise((resolveListen) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Failed to bind PDF preview server");
      }
      resolveListen({ server, port: address.port });
    });
  });
}

async function renderPdf(page, baseUrl, target) {
  await page.addInitScript((lang) => {
    try {
      localStorage.setItem("preferred-lang", lang);
    } catch {
      // ignore
    }
  }, target.lang);

  await page.emulateMedia({ media: "screen", colorScheme: "light" });
  await page.goto(new URL(target.path, baseUrl).href, {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => document.fonts.ready);
  // Rebuild a plain single-column resume so ATS extraction stays linear
  await page.evaluate(() => {
    const text = (el) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
    const name = text(document.querySelector(".profile-name"));
    const title = text(document.querySelector(".profile-title"));
    const contacts = [...document.querySelectorAll(".vcard-detail")]
      .map((li) => text(li))
      .filter(Boolean);

    const sections = [...document.querySelectorAll(".profile-main > section.Box")].map(
      (section) => {
        const heading = text(
          section.querySelector(".Box-title"),
        ).replace(/\s+\d+.*$/, "");
        const kind = heading.toLowerCase();

        if (kind.includes("experience") || kind.includes("опыт")) {
          const roles = [...section.querySelectorAll(".TimelineItem")].map((item) => {
            const companyEl =
              item.querySelector(".experience__company [itemprop='name']") ??
              item.querySelector(".experience__company");
            const company = text(companyEl)
              .replace(
                /\s*\d+\s+(?:years?|months?|год(?:а|ов)?|лет|мес(?:яц(?:а|ев)?)?).*$/i,
                "",
              )
              .replace(/(\D)\d+\s+(?:years?|months?|год(?:а|ов)?|лет|мес).*$/i, "$1")
              .trim();
            const position = text(item.querySelector(".experience__position"));
            const meta = text(item.querySelector(".experience__meta"));
            const description = text(item.querySelector(".experience__description"));
            const bullets = [...item.querySelectorAll(".experience__list-item")].map((li) =>
              text(li).replace(/\s*→\s*/g, ", "),
            );
            return { company, position, meta, description, bullets };
          });
          return {
            heading:
              /experience/i.test(heading)
                ? "Experience"
                : heading.startsWith("Опыт")
                  ? "Опыт работы"
                  : heading,
            roles,
          };
        }

        if (kind.includes("skill") || kind.includes("навык")) {
          const skills = [...section.querySelectorAll(".skill")]
            .map((skill) => text(skill))
            .filter(Boolean);
          return { heading: heading.includes("Навык") ? "Навыки" : "Skills", skills };
        }

        if (kind.includes("education") || kind.includes("образован")) {
          return {
            heading: heading.includes("Образован") ? "Образование" : "Education",
            university: text(section.querySelector(".education__university")),
            degree: text(section.querySelector(".education__degree")),
            period: text(section.querySelector(".text-muted")),
          };
        }

        if (kind.includes("language") || kind.includes("язык")) {
          const languages = [...section.querySelectorAll(".language")].map((row) => {
            const name = text(row.querySelector(".language__name"));
            const level = text(row.querySelector(".text-muted"));
            return [name, level].filter(Boolean).join(" — ");
          });
          return {
            heading: heading.includes("Язык") ? "Языки" : "Languages",
            languages,
          };
        }

        return { heading, html: section.querySelector(".Box-body")?.innerHTML ?? "" };
      },
    );

    const root = document.createElement("div");
    root.className = "ats-resume";

    const header = document.createElement("header");
    header.innerHTML = `<h1>${name}</h1><p class="ats-title">${title}</p><p class="ats-contacts">${contacts.join("<br>")}</p>`;
    root.appendChild(header);

    for (const section of sections) {
      const el = document.createElement("section");
      const h2 = document.createElement("h2");
      h2.textContent = section.heading;
      el.appendChild(h2);

      if (section.roles) {
        for (const role of section.roles) {
          const article = document.createElement("article");
          article.innerHTML = `
            <h3>${role.company}</h3>
            <p class="ats-position">${role.position}</p>
            <p class="ats-meta">${role.meta}</p>
            <p>${role.description}</p>
            <ul>${role.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
          `;
          el.appendChild(article);
        }
      } else if (section.skills) {
        const p = document.createElement("p");
        p.textContent = section.skills.join(", ");
        el.appendChild(p);
      } else if (section.university) {
        el.innerHTML += `<h3>${section.university}</h3><p>${section.degree}</p><p>${section.period}</p>`;
      } else if (section.languages) {
        for (const line of section.languages) {
          const p = document.createElement("p");
          p.textContent = line;
          el.appendChild(p);
        }
      }

      root.appendChild(el);
    }

    document.body.replaceChildren(root);
  });

  await page.addStyleTag({
    content: `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #111111 !important;
        font-family: Arial, Helvetica, sans-serif !important;
      }
      .ats-resume {
        max-width: 720px !important;
        margin: 0 !important;
        padding: 24px !important;
        display: block !important;
      }
      .ats-resume * {
        position: static !important;
        float: none !important;
        display: block !important;
        width: auto !important;
        max-width: none !important;
        box-shadow: none !important;
        border: 0 !important;
        background: transparent !important;
        columns: auto !important;
        column-count: 1 !important;
      }
      .ats-resume ul { padding-left: 18px !important; }
      .ats-resume li { display: list-item !important; margin: 0 0 6px !important; }
      .ats-resume h1 { font-size: 28px !important; margin: 0 0 4px !important; }
      .ats-resume h2 { font-size: 16px !important; margin: 20px 0 8px !important; text-transform: none !important; }
      .ats-resume h3 { font-size: 14px !important; margin: 12px 0 2px !important; }
      .ats-resume p { font-size: 13px !important; margin: 0 0 6px !important; line-height: 1.4 !important; }
      .ats-title { font-size: 15px !important; margin-bottom: 10px !important; }
      .ats-contacts { margin-bottom: 8px !important; }
      .ats-meta, .ats-position { color: #333333 !important; }
    `,
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  const metrics = await page.evaluate(() => {
    const rootEl =
      document.querySelector(".ats-resume") ??
      document.querySelector(".page") ??
      document.body;
    const rect = rootEl.getBoundingClientRect();
    return {
      width: Math.ceil(Math.max(rect.width, 720)),
      height: Math.ceil(
        Math.max(
          rootEl.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        ),
      ),
    };
  });

  const pdfPath = join(outDir, target.file);
  await page.pdf({
    path: pdfPath,
    width: `${metrics.width + 48}px`,
    height: `${metrics.height + 48}px`,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  await copyFile(pdfPath, join(publicDir, target.file));
  console.log(`Generated ${target.file}`);
}

async function main() {
  if (!existsSync(join(outDir, "index.html"))) {
    throw new Error("out/ is missing. Run next build first.");
  }

  await mkdir(publicDir, { recursive: true });

  const { server, port } = await startStaticServer(outDir);
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true });

  try {
    for (const target of targets) {
      const page = await browser.newPage({
        viewport: { width: 1200, height: 1600 },
        deviceScaleFactor: 2,
      });
      try {
        await renderPdf(page, baseUrl, target);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
