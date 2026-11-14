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
  await page.addStyleTag({
    content: `
      .page-actions { display: none !important; }
      .profile-sidebar { position: static !important; }
      .page { min-height: auto !important; }
      body { background: #ffffff !important; }
    `,
  });

  // Let layout settle after hiding chrome
  await new Promise((resolve) => setTimeout(resolve, 100));

  const metrics = await page.evaluate(() => {
    const rootEl = document.querySelector(".page") ?? document.body;
    const rect = rootEl.getBoundingClientRect();
    return {
      width: Math.ceil(
        Math.max(rect.width, document.documentElement.scrollWidth),
      ),
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
    width: `${Math.max(metrics.width, 1024)}px`,
    height: `${metrics.height + 32}px`,
    printBackground: true,
    margin: { top: "16px", right: "16px", bottom: "16px", left: "16px" },
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
