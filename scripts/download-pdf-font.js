/**
 * Tải font Noto Sans Regular (TTF) vào public/fonts/ để xuất PDF tiếng Việt đúng.
 * Chạy 1 lần: npm run download-pdf-font
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_URLS = [
  'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
  'https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Regular.ttf',
];
const OUT_DIR = path.join(__dirname, '..', 'public', 'fonts');
const OUT_FILE = path.join(OUT_DIR, 'NotoSans-Regular.ttf');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function main() {
  console.log('Đang tải font Noto Sans Regular...');
  for (const url of FONT_URLS) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 1000) throw new Error('File quá nhỏ');
      fs.writeFileSync(OUT_FILE, Buffer.from(buf));
      console.log('Đã lưu:', OUT_FILE);
      return;
    } catch (e) {
      console.warn('Thử URL khác...', e.message);
    }
  }
  console.error('Không tải được font. Tải thủ công từ https://fonts.google.com/noto/specimen/Noto+Sans và đặt NotoSans-Regular.ttf vào public/fonts/');
  process.exit(1);
}

main();
