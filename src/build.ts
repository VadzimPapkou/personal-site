import * as Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import duration from 'dayjs/plugin/duration';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(duration);
dayjs.extend(customParseFormat);

const LANGUAGES = ['ru', 'en'];
const VIEWS_DIR = path.join(__dirname, '../src/views');
const LOCALES_DIR = path.join(__dirname, '../src/locales');
const OUTPUT_DIR = path.join(__dirname, '../dist');
const STYLES_FILE = path.join(__dirname, '../src/styles.css');
const PUBLIC_DIR = path.join(__dirname, '../public');
const ROBOTS_FILE = path.join(__dirname, '../src/robots.txt');
const SITEMAP_FILE = path.join(__dirname, '../src/sitemap.xml');

// Загрузка локали
const loadLocale = (lang: string): any => {
  const localePath = path.join(LOCALES_DIR, `${lang}.json`);
  const localeData = fs.readFileSync(localePath, 'utf-8');
  return JSON.parse(localeData);
};

// Регистрация helpers для Handlebars
Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

// Helper для форматирования периода работы
Handlebars.registerHelper('formatPeriod', (startDate: string, endDate: string | null, lang: string) => {
  dayjs.locale(lang);
  const start = dayjs(startDate);
  const end = endDate ? dayjs(endDate) : dayjs();
  
  let startFormatted = start.format('MMM YYYY');
  let endFormatted = endDate ? end.format('MMM YYYY') : (lang === 'ru' ? 'настоящее время' : 'present');
  
  // Капитализируем первую букву для русской локали
  if (lang === 'ru' && startFormatted) {
    startFormatted = startFormatted.charAt(0).toUpperCase() + startFormatted.slice(1);
  }
  if (lang === 'ru' && endFormatted && endDate) {
    endFormatted = endFormatted.charAt(0).toUpperCase() + endFormatted.slice(1);
  }
  
  return `${startFormatted} – ${endFormatted}`;
});

// Helper для вычисления опыта работы в годах и месяцах
Handlebars.registerHelper('calculateExperience', (startDate: string, endDate: string | null) => {
  const start = dayjs(startDate);
  const end = endDate ? dayjs(endDate) : dayjs();
  
  const diff = dayjs.duration(end.diff(start));
  const years = Math.floor(diff.asYears());
  const months = Math.floor(diff.asMonths() % 12);
  
  return { years, months };
});

// Helper для форматирования опыта работы
Handlebars.registerHelper('formatExperience', (startDate: string, endDate: string | null, lang: string) => {
  const { years, months } = Handlebars.helpers.calculateExperience(startDate, endDate) as { years: number; months: number };
  
  const parts: string[] = [];
  if (years > 0) {
    if (lang === 'ru') {
      parts.push(`${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`);
    } else {
      parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    }
  }
  if (months > 0) {
    if (lang === 'ru') {
      parts.push(`${months} ${months === 1 ? 'мес' : months < 5 ? 'мес' : 'мес'}`);
    } else {
      parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    }
  }
  
  return parts.length > 0 ? parts.join(' ') : (lang === 'ru' ? 'менее месяца' : 'less than a month');
});

// Helper для вычисления общего опыта работы
Handlebars.registerHelper('formatTotalExperience', (experiences: any[], lang: string) => {
  if (!experiences || experiences.length === 0) {
    return lang === 'ru' ? 'менее месяца' : 'less than a month';
  }
  
  // Вычисляем общий опыт, суммируя все периоды работы
  let totalMonths = 0;
  
  for (const exp of experiences) {
    const start = dayjs(exp.startDate);
    const end = exp.endDate ? dayjs(exp.endDate) : dayjs();
    const diff = dayjs.duration(end.diff(start));
    totalMonths += Math.floor(diff.asMonths());
  }
  
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  
  const parts: string[] = [];
  if (years > 0) {
    if (lang === 'ru') {
      parts.push(`${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`);
    } else {
      parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    }
  }
  if (months > 0) {
    if (lang === 'ru') {
      parts.push(`${months} ${months === 1 ? 'мес' : months < 5 ? 'мес' : 'мес'}`);
    } else {
      parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    }
  }
  
  return parts.length > 0 ? parts.join(' ') : (lang === 'ru' ? 'менее месяца' : 'less than a month');
});

// Загрузка шаблона
const loadTemplate = (): string => {
  const layoutPath = path.join(VIEWS_DIR, 'layouts', 'main.hbs');
  const indexPath = path.join(VIEWS_DIR, 'index.hbs');
  
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  
  // Заменяем {{{body}}} в layout на содержимое index
  return layoutContent.replace('{{{body}}}', indexContent);
};

// Компиляция шаблона
const compileTemplate = (lang: string): string => {
  const template = loadTemplate();
  const compiled = Handlebars.compile(template);
  const t = loadLocale(lang);
  
  // Устанавливаем локаль для dayjs
  dayjs.locale(lang);
  
  return compiled({
    lang,
    t,
  });
};

// Создание HTML файла
const buildHTML = (lang: string): void => {
  const html = compileTemplate(lang);
  const outputPath = lang === 'ru' 
    ? path.join(OUTPUT_DIR, 'index.html')
    : path.join(OUTPUT_DIR, `index-${lang}.html`);
  
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`✓ Built ${outputPath}`);
};

// Рекурсивное копирование директории
const copyDirectory = (src: string, dest: string): void => {
  if (!fs.existsSync(src)) {
    console.log(`Warning: Source directory ${src} does not exist`);
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  → Copied ${entry.name}`);
    }
  }
};

// Генерация sitemap с актуальной датой
const generateSitemap = (): string => {
  const today = new Date().toISOString().split('T')[0];
  const sitemapContent = fs.readFileSync(SITEMAP_FILE, 'utf-8');
  // Заменяем любую дату в формате YYYY-MM-DD на текущую дату
  return sitemapContent.replace(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
};

// Копирование статических файлов
const copyStaticFiles = (): void => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Копируем CSS
  const stylesContent = fs.readFileSync(STYLES_FILE, 'utf-8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'styles.css'), stylesContent, 'utf-8');
  console.log('✓ Copied styles.css');
  
  // Копируем robots.txt
  if (fs.existsSync(ROBOTS_FILE)) {
    const robotsContent = fs.readFileSync(ROBOTS_FILE, 'utf-8');
    fs.writeFileSync(path.join(OUTPUT_DIR, 'robots.txt'), robotsContent, 'utf-8');
    console.log('✓ Copied robots.txt');
  }
  
  // Генерируем и копируем sitemap.xml
  if (fs.existsSync(SITEMAP_FILE)) {
    const sitemapContent = generateSitemap();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemapContent, 'utf-8');
    console.log('✓ Generated sitemap.xml');
  }
  
  // Копируем папку public
  if (fs.existsSync(PUBLIC_DIR)) {
    console.log(`Copying from ${PUBLIC_DIR} to ${OUTPUT_DIR}`);
    copyDirectory(PUBLIC_DIR, OUTPUT_DIR);
    console.log('✓ Copied public directory');
  } else {
    console.log(`Warning: Public directory ${PUBLIC_DIR} does not exist`);
  }
};

// Сборка всех языков
const build = (): void => {
  console.log('Building static site...\n');
  
  copyStaticFiles();
  
  LANGUAGES.forEach(lang => {
    buildHTML(lang);
  });
  
  console.log('\n✓ Build complete!');
};

// Watch режим
const watch = (): void => {
  console.log('Watching for changes...\n');
  
  const watcher = chokidar.watch([
    path.join(VIEWS_DIR, '**/*.hbs'),
    path.join(LOCALES_DIR, '**/*.json'),
    STYLES_FILE,
    path.join(PUBLIC_DIR, '**/*'),
  ], {
    ignored: /node_modules/,
    persistent: true,
  });
  
  watcher.on('change', (filePath) => {
    console.log(`\nFile changed: ${filePath}`);
    build();
  });
  
  // Первоначальная сборка
  build();
};

// Запуск
const args = process.argv.slice(2);
const isWatch = args.includes('--watch') || args.includes('-w');

if (isWatch) {
  watch();
} else {
  build();
}

