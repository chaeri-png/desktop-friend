import sharp from 'sharp';
import fs from 'node:fs';

fs.mkdirSync('assets', { recursive: true });
fs.mkdirSync('build', { recursive: true });

const svg = fs.readFileSync('characters/baepsae/idle.svg');
await sharp(svg, { density: 300 }).resize(32, 32).png().toFile('assets/tray.png');
await sharp(svg, { density: 600 }).resize(512, 512).png().toFile('build/icon.png');
console.log('아이콘 생성 완료: assets/tray.png, build/icon.png');
