import { copyFile, stat } from 'node:fs/promises';

const fallbackPath = new URL('../build/404.html', import.meta.url);
const indexPath = new URL('../build/index.html', import.meta.url);

try {
  await stat(indexPath);
} catch {
  await copyFile(fallbackPath, indexPath);
}
