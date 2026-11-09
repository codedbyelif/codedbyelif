// Snake bitince ızgarada EL'S yazdırır.
// Platane/snk'nin ürettiği SVG'nin zaman çizelgesini sıkıştırıp sonuna yazının durduğu bir bekleme ekler.
import { readFileSync, writeFileSync } from "node:fs";

const K = 0.85; // eski döngü yeni döngünün %85'ine sığar, kalan %15 yazı için
const GLYPHS = {
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  "'": ["#", "#", ".", ".", ".", ".", "."],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
};
const TEXT = ["E", "L", "'", "S"];
const CELL = 16;
const COLS = 53;
// Her harfin görünmeye başladığı an (yeni döngü yüzdesi); hepsi %99'a kadar kalır
const APPEAR = [84.5, 85.5, 86.5, 87.5];

const round = (n) => Math.round(n * 1000) / 1000;

function stretch(svg) {
  const duration = Number(svg.match(/(\d+)ms/)[1]);
  svg = svg.replaceAll(`${duration}ms`, `${Math.round(duration / K)}ms`);
  return svg.replace(/@keyframes ([\w-]+)\{((?:[^{}]*\{[^{}]*\})*)\}/g, (_, name, body) => {
    const blocks = [...body.matchAll(/([^{}]*)\{([^{}]*)\}/g)].map(([, sel, decl]) => ({
      percents: sel.split(",").map((p) => parseFloat(p)),
      decl,
    }));
    const max = Math.max(...blocks.flatMap((b) => b.percents));
    const out = blocks.map((b) => {
      const sel = b.percents.map((p) => `${round(p * K)}%`);
      if (b.percents.includes(max)) sel.push("100%");
      return `${sel.join(",")}{${b.decl}}`;
    });
    return `@keyframes ${name}{${out.join("")}}`;
  });
}

function lettering() {
  const width = TEXT.reduce((w, ch) => w + GLYPHS[ch][0].length + 1, -1);
  let col = Math.floor((COLS - width) / 2);
  let css = ".els{fill:var(--c4);opacity:0;animation:none linear var(--els-d) infinite}";
  let rects = "";
  TEXT.forEach((ch, i) => {
    const start = APPEAR[i];
    css += `@keyframes els${i}{0%,${start}%{opacity:0}${start + 1}%,99%{opacity:1}100%{opacity:0}}`;
    css += `.els.els${i}{animation-name:els${i}}`;
    GLYPHS[ch].forEach((row, r) => {
      [...row].forEach((on, c) => {
        if (on !== "#") return;
        const x = 2 + (col + c) * CELL;
        const y = 2 + r * CELL;
        rects += `<rect class="els els${i}" x="${x}" y="${y}" width="12" height="12" rx="2" ry="2"/>`;
      });
    });
    col += GLYPHS[ch][0].length + 1;
  });
  return { css, rects };
}

for (const file of process.argv.slice(2)) {
  let svg = stretch(readFileSync(file, "utf8"));
  const duration = svg.match(/(\d+)ms/)[1];
  const { css, rects } = lettering();
  svg = svg
    .replace("</style>", `${css.replace("var(--els-d)", `${duration}ms`)}</style>`)
    .replace("</svg>", `${rects}</svg>`);
  writeFileSync(file, svg);
  console.log(`EL'S eklendi: ${file}`);
}
