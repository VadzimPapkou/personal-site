import * as Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

const LANGUAGES = ['ru', 'en'];
const VIEWS_DIR = path.join(__dirname, '../src/views');
const LOCALES_DIR = path.join(__dirname, '../src/locales');
const OUTPUT_DIR = path.join(__dirname, '../dist');
const STYLES_FILE = path.join(__dirname, '../src/styles.css');
const PUBLIC_DIR = path.join(__dirname, '../public');

// Загрузка локали
const loadLocale = (lang: string): any => {
  const localePath = path.join(LOCALES_DIR, `${lang}.json`);
  const localeData = fs.readFileSync(localePath, 'utf-8');
  return JSON.parse(localeData);
};

// Регистрация helpers для Handlebars
Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

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

// Копирование статических файлов
const copyStaticFiles = (): void => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Копируем CSS
  const stylesContent = fs.readFileSync(STYLES_FILE, 'utf-8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'styles.css'), stylesContent, 'utf-8');
  console.log('✓ Copied styles.css');
  
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

