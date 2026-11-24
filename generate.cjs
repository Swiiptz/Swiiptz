#!/usr/bin/env node
/*
 * Générateur de profil GitHub « Royaume souterrain » (inspiré de l'ambiance Hollow Knight).
 * Aucun asset externe : sprites pixel-art dessinés en code, GIF encodés à la main,
 * SVG animés en CSS (GitHub les affiche dans <img>).
 *
 *   node generate.cjs      → régénère assets/*.gif, assets/*.svg et README.md
 *
 * Modifie CONFIG ci-dessous puis relance.
 */
const fs = require('fs');
const path = require('path');

const CONFIG = {
  username: 'Swiiptz',               // ton pseudo GitHub (utilisé pour les stats)
  name: 'SWIIPTZ',                   // titre de la bannière
  tagline: 'Développeur · cartographe des royaumes oubliés',
  greeting: '~ Bienvenue, voyageur ~',
  about: [
    ['🗺️', "<b>Quête en cours</b> : <i>Au fond des archives, d'anciens grimoires attendent qu'on les traduise. Je fabrique des automates qui tournent les pages à ma place.</i><br/>↳ <code>Automatisation de traduction</code>"],
    ['🕯️', "<b>Savoir convoité</b> : <i>On raconte qu'une lanterne bien nourrie de parchemins finit par répondre aux questions des voyageurs.</i><br/>↳ <code>IA &amp; RAG</code>"],
    ['🪲', "<b>Terrain de chasse</b> : <i>Les insectes nichent entre les balises et sous les feuilles de style. Aucun ne m'échappe longtemps.</i><br/>↳ <code>HTML / CSS</code>"],
  ],
  skills: 'js,ts,nodejs,html,css,git,github,vscode',   // ids skillicons.dev
  footer: 'Repose-toi un instant, voyageur. Le chemin continue.',
};

const OUT = path.join(__dirname, 'assets');
fs.mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------------ palette */
const PAL = [
  ['.', '#000000'], // 0 transparent
  ['1', '#0b0d17'], // contour
  ['2', '#2b3150'], // cape
  ['3', '#1c2038'], // cape ombre
  ['c', '#46507e'], // cape lumière
  ['4', '#eef1f8'], // visage
  ['5', '#b9c2d6'], // visage ombre
  ['6', '#05060b'], // yeux
  ['7', '#cdd5e6'], // antennes
  ['8', '#7fdcff'], // lueur
  ['9', '#f2fdff'], // cœur de lanterne
  ['a', '#6b5a44'], // bâton
  ['b', '#3a3f55'], // cadre lanterne
  ['g', '#1d4a63'], // halo
  ['s', '#2f7d7a'], // carapace scarabée
  ['S', '#5fc2b2'], // carapace reflet
  ['p', '#d8f0e6'], // taches
  ['l', '#141826'], // pattes
  ['k', '#05070f'], // fond 1
  ['K', '#080c18'], // fond 2
  ['m', '#0c1222'], // fond 3
  ['f', '#121a31'], // flèches lointaines
  ['F', '#18213f'], // stalactites
  ['G', '#090c18'], // sol
  ['e', '#25304f'], // bord du sol
  ['t', '#3b4a7a'], // herbe
  ['o', '#bff1ff'], // spore vive
  ['O', '#3a6a8a'], // spore faible
  ['w', '#2c3a63'], // fenêtre éteinte
  ['W', '#6fc6e6'], // fenêtre allumée
  ['A', '#121630'], // cape sombre
  ['B', '#232a55'], // cape
  ['D', '#36417f'], // cape éclairée
  ['E', '#5a6cc4'], // liseré de lumière
  ['M', '#f6f8fd'], // masque
  ['N', '#d2d8e8'], // masque ombre
  ['P', '#98a2c0'], // masque ombre profonde
  ['q', '#9fe9ff'], // reflet des yeux
  ['r', '#6e2a40'], // écharpe ombre
  ['R', '#b4506a'], // écharpe
  ['x', '#d6a24a'], // laiton clair
  ['X', '#7d5726'], // laiton sombre
  ['z', '#e3e9f5'], // antennes
  ['L', '#3a4163'], // jambe avant
  ['Q', '#262b45'], // jambe arrière
  ['I', '#2a3152'], // fer forgé
  ['J', '#56618f'], // fer reflet
  ['H', '#a3aed6'], // fer éclat
];
const IDX = Object.fromEntries(PAL.map(([k], i) => [k, i]));
const C = (k) => IDX[k];

/* --------------------------------------------------------------------- grid */
class Grid {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h); }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.d[y * this.w + x]; }
  set(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = typeof c === 'string' ? C(c) : c;
  }
  ellipse(cx, cy, rx, ry, c, pred = () => true) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && pred(x, y)) this.set(x, y, c);
  }
  outline(c = '1') {
    const o = C(c), src = this.d.slice();
    const at = (x, y) => (x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : src[y * this.w + x]);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (!at(x, y) && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) this.d[y * this.w + x] = o;
  }
  blit(g, dx, dy) {
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const v = g.d[y * g.w + x]; if (v) this.set(x + dx, y + dy, v); }
  }
  scale(k) {
    const r = new Grid(this.w * k, this.h * k);
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) r.d[y * r.w + x] = this.d[((y / k) | 0) * this.w + ((x / k) | 0)];
    return r;
  }
}

/* ----------------------------------------------------------------- sprites */
const TAU = Math.PI * 2;
// Le petit chevalier (fan-art pixel) : capuche, masque à cornes dessinés à la main, cape pointue, jambes trapues.
// a = angle d'animation de la cape (boucle sur 2π), ma = angle du papillon, trail = cape qui traîne en marchant.
function knight({ pose = 'stand', bob = 0, a = 0, trail = 0, near = 0, far = 0, liftN = 0, liftF = 0, moth = true, ma = a } = {}) {
  const g = new Grid(34, 44);
  const OX = 5;
  const Y = (y) => y + 2 + bob;
  const sit = pose === 'sit';
  const span = (rows, col) => rows.forEach(([y, x0, x1]) => { for (let x = x0; x <= x1; x++) g.set(x + OX, Y(y), typeof col === 'function' ? col(x, y, x0, x1) : col); });

  // jambes trapues en pointe
  const leg = (hx, fx, y0, y1, c) => {
    const n = Math.max(1, y1 - y0);
    for (let y = y0; y <= y1; y++) {
      const t = (y - y0) / n, w = t < 0.5 ? 3 : t < 0.85 ? 2 : 1;
      const x = Math.round(hx + (fx - hx) * t) + (3 - w);
      for (let i = 0; i < w; i++) g.set(x + i, Y(y), c);
    }
  };
  if (sit) { const k = Math.round(Math.sin(a)); leg(15, 15 - k, 26, 32, 'Q'); leg(19, 19 + k, 26, 32, 'L'); }
  else { leg(14, 14 + far, 26, 36 - liftF, 'Q'); leg(18, 18 + near, 26, 36 - liftN, 'L'); }

  // cape : courte devant, longue et pointue derrière
  {
    const top = 19, sway = Math.sin(a) * 0.9 + trail;
    const hemFront = sit ? 25 : 26, hemBack = sit ? 29 : 31;
    for (let y = top; y <= hemBack + 1; y++) {
      const p = (y - top) / (hemBack - top);
      const right = Math.round(23 + Math.min(p, 0.6) * 2);
      const left = Math.round(10 - Math.pow(p, 1.3) * (6 + sway));
      for (let x = left; x <= right; x++) {
        const q = (right - x) / Math.max(1, right - left);
        if (y > hemFront + (hemBack - hemFront) * Math.pow(q, 0.8)) continue;
        let c = q < 0.2 ? 'D' : q < 0.75 ? 'B' : 'c';
        if (y > top + 2 && x === Math.round(19 - p * 2)) c = 'A';
        if (y > top + 4 && x === Math.round(14 - p * 4)) c = 'A';
        g.set(x, Y(y), c);
      }
    }
    const tipX = Math.round(10 - (6 + sway)) - 1;
    g.set(tipX, Y(hemBack + 1), 'A'); g.set(tipX - 1, Y(hemBack + 2), 'A');
  }

  // capuche (sac arrondi, pointe arrière qui flotte)
  const hood = [[4, 4, 13], [5, 3, 15], [6, 2, 16], ...[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((y) => [y, 1, 18]), [18, 2, 18], [19, 3, 18], [20, 4, 18]];
  span(hood, (x, y, x0, x1) => (x <= x0 + 1 ? 'A' : y <= 5 ? 'D' : x === 7 && y >= 9 ? 'A' : 'B'));
  span(Math.sin(a) > 0 ? [[4, 2, 3], [5, 1, 2]] : [[4, 2, 3], [5, 1, 2], [6, 0, 1]], 'B');

  // masque
  const mask = [[7, 13, 17], [8, 12, 19], [9, 11, 20], [10, 11, 21], [11, 11, 22], [12, 11, 22], [13, 11, 22], [14, 11, 22], [15, 11, 22], [16, 11, 21], [17, 12, 21], [18, 13, 20], [19, 15, 19]];
  span(mask, (x, y, x0, x1) => (y >= 18 || x <= 13 || (y === 17 && x <= 14) ? 'N' : 'M'));
  // bord de capuche qui encadre le masque
  for (let y = 8; y <= 17; y++) { const rx = y === 8 || y === 17 ? 13 : 12; g.set(rx + OX, Y(y), 'D'); g.set(rx - 1 + OX, Y(y), 'B'); }
  // grand œil
  span([[11, 18, 19], [12, 17, 20], [13, 17, 20], [14, 17, 20], [15, 17, 20], [16, 17, 20], [17, 18, 19]], '6');
  // cornes
  span([[6, 12, 14], [5, 11, 13], [4, 10, 12], [3, 10, 11], [2, 10, 11], [1, 10, 10], [0, 10, 10]], 'N');
  span([[6, 17, 19], [5, 18, 20], [4, 19, 21], [3, 20, 21], [2, 20, 21], [1, 21, 21], [0, 21, 21]], 'M');

  g.outline('1');

  // papillon de lumière qui tourne lentement autour de la tête (passe derrière)
  if (moth) {
    const pos = (t) => [Math.round(20 + 12 * Math.cos(t)), Math.round(Y(11) + 3 * Math.sin(t))];
    const behind = Math.sin(ma) < -0.15;
    const put = (x, y, c) => { if (!behind || !g.get(x, y)) g.set(x, y, c); };
    [[0.75, 'g'], [0.5, 'O'], [0.25, 'O']].forEach(([d, c]) => { const [tx, ty] = pos(ma - d); if (!g.get(tx, ty)) g.set(tx, ty, c); });
    const [mx, my] = pos(ma), open = Math.floor((a / TAU) * 12) % 2 === 0;
    for (const [dx, dy] of [[-3, 0], [3, 0], [0, -2], [0, 2], [-2, 1], [2, 1], [-2, -2], [2, -2]]) if (!g.get(mx + dx, my + dy)) g.set(mx + dx, my + dy, 'g');
    const wings = open
      ? [[-2, -1, 'o'], [-1, -1, 'o'], [1, -1, 'o'], [2, -1, 'o'], [-1, 0, 'q'], [1, 0, 'q'], [-1, 1, 'O'], [1, 1, 'O']]
      : [[-1, -1, 'o'], [1, -1, 'o'], [-1, 0, 'q'], [1, 0, 'q']];
    for (const [dx, dy, c] of wings) put(mx + dx, my + dy, c);
    put(mx, my, '9');
  }
  g.lantern = { x: 21, y: Y(13) };
  return g;
}

// Banc en fer forgé (style royaume souterrain).
function bench(W = 62) {
  const g = new Grid(W, 24), R = W - 4;
  const ring = (cx, cy) => { for (let t = 0; t < 16; t++) g.set(cx + Math.round(Math.cos(t * Math.PI / 8) * 2), cy + Math.round(Math.sin(t * Math.PI / 8) * 2), 'I'); };
  for (let x = 4; x <= R - 1; x++) { g.set(x, 3, 'J'); g.set(x, 4, 'I'); g.set(x, 10, 'I'); }
  for (let cx = 9; cx <= R - 5; cx += 7) { ring(cx, 7); g.set(cx, 7, 'H'); if (cx + 7 <= R - 5) { g.set(cx + 3, 6, 'I'); g.set(cx + 4, 8, 'I'); } }
  for (const px of [3, R]) {
    for (let y = 1; y <= 14; y++) g.set(px, y, y < 3 ? 'J' : 'I');
    g.set(px, 0, 'H'); g.set(px - 1, 1, 'J'); g.set(px + 1, 1, 'J');
  }
  const mid = Math.floor(W / 2);
  g.set(mid, 0, 'H'); g.set(mid - 1, 1, 'J'); g.set(mid, 1, 'J'); g.set(mid + 1, 1, 'J'); g.set(mid, 2, 'I');
  for (let x = 1; x <= W - 2; x++) { g.set(x, 12, 'H'); g.set(x, 13, 'J'); g.set(x, 14, 'I'); }
  for (const [x0, dir] of [[5, -1], [W - 6, 1]]) {
    for (let y = 15; y <= 21; y++) g.set(x0 + (y > 18 ? dir * (y - 18) : 0), y, 'I');
    g.set(x0 + dir * 4, 21, 'J'); g.set(x0 + dir * 4, 20, 'I');
    g.set(x0 - dir, 16, 'I'); g.set(x0 - dir * 2, 17, 'I'); g.set(x0 - dir * 2, 18, 'J');
  }
  for (let y = 15; y <= 18; y++) g.set(mid, y, 'I');
  g.set(mid - 1, 19, 'I'); g.set(mid + 1, 19, 'I'); g.set(mid - 2, 19, 'J'); g.set(mid + 2, 19, 'J');
  g.outline('1');
  return g;
}

// Le Rampeur : petit scarabée turquoise (original).
function beetle(phase = 0) {
  const g = new Grid(18, 11);
  g.ellipse(8, 7, 6, 4.5, 's', (x, y) => y <= 7);
  for (const [x, y] of [[5, 4], [6, 3], [7, 3], [4, 5]]) g.set(x, y, 'S');
  for (const [x, y] of [[8, 5], [11, 4], [6, 6]]) g.set(x, y, 'p');
  g.ellipse(14.5, 7, 1.6, 1.4, 'l');
  g.set(15, 5, 'l'); g.set(16, 4, 'l');
  g.outline('1');
  for (let x = 3; x <= 13; x++) g.set(x, 8, 'l');
  for (const [i, x] of [4, 8, 12].entries()) {
    const off = (i + phase) % 2 ? 1 : -1;
    g.set(x, 9, 'l'); g.set(x + off, 10, 'l');
  }
  return g;
}

/* -------------------------------------------------------------- GIF encode */
function lzw(minCode, px) {
  const clear = 1 << minCode, eoi = clear + 1;
  let size = minCode + 1, next = eoi + 1, dict = new Map();
  const out = []; let cur = 0, bits = 0;
  const emit = (c) => { cur |= c << bits; bits += size; while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; } };
  emit(clear);
  let prefix = px[0];
  for (let i = 1; i < px.length; i++) {
    const k = px[i], key = (prefix << 8) | k;
    const hit = dict.get(key);
    if (hit !== undefined) { prefix = hit; continue; }
    emit(prefix);
    if (next === 4096) { emit(clear); dict = new Map(); size = minCode + 1; next = eoi + 1; }
    else { if (next >= 1 << size) size++; dict.set(key, next++); }
    prefix = k;
  }
  emit(prefix); emit(eoi);
  if (bits > 0) out.push(cur & 255);
  return out;
}

function encodeGIF(frames, { transparent = false, loop = true } = {}) {
  const { w, h } = frames[0].grid;
  let n = 1; while ((1 << n) < PAL.length) n++;
  const minCode = Math.max(2, n);
  const b = [];
  const u16 = (v) => b.push(v & 255, (v >> 8) & 255);
  b.push(...Buffer.from('GIF89a'));
  u16(w); u16(h); b.push(0xf0 | (n - 1), 0, 0);
  for (let i = 0; i < 1 << n; i++) {
    const hex = (PAL[i] || PAL[0])[1];
    b.push(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16));
  }
  if (loop) b.push(0x21, 0xff, 0x0b, ...Buffer.from('NETSCAPE2.0'), 3, 1, 0, 0, 0);
  for (const { grid, delay } of frames) {
    b.push(0x21, 0xf9, 4, transparent ? (2 << 2) | 1 : 1 << 2); u16(delay); b.push(0, 0);
    b.push(0x2c); u16(0); u16(0); u16(w); u16(h); b.push(0);
    b.push(minCode);
    const data = lzw(minCode, grid.d);
    for (let i = 0; i < data.length; i += 255) { const chunk = data.slice(i, i + 255); b.push(chunk.length, ...chunk); }
    b.push(0);
  }
  b.push(0x3b);
  return Buffer.from(b);
}

/* ------------------------------------------------------------- utilitaires */
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const save = (f, data) => { fs.writeFileSync(path.join(OUT, f), data); console.log(`  ${f.padEnd(22)} ${(Buffer.byteLength(data) / 1024).toFixed(1)} Ko`); };

// pixel grid → rectangles SVG (runs horizontaux)
function gridToRects(g, k) {
  let s = '';
  for (let y = 0; y < g.h; y++) {
    let x = 0;
    while (x < g.w) {
      const v = g.d[y * g.w + x];
      if (!v) { x++; continue; }
      let e = x; while (e + 1 < g.w && g.d[y * g.w + e + 1] === v) e++;
      s += `<rect x="${x * k}" y="${y * k}" width="${(e - x + 1) * k}" height="${k}" fill="${PAL[v][1]}"/>`;
      x = e + 1;
    }
  }
  return s;
}
// animation image par image en CSS (chaque frame visible 1/n du temps)
function svgFrames(grids, k, dur, cls) {
  const n = grids.length;
  const css = `@keyframes ${cls}k{0%{opacity:1}${(100 / n).toFixed(3)}%{opacity:0}100%{opacity:0}}` +
    grids.map((_, i) => `.${cls}${i}{animation:${cls}k ${dur}s step-end infinite;animation-delay:-${(((n - i) % n) * dur / n).toFixed(3)}s}`).join('');
  const body = grids.map((g, i) => `<g class="${cls}${i}">${gridToRects(g, k)}</g>`).join('');
  return { css, body };
}

/* --------------------------------------------------------------------- GIFs */
console.log('Génération des sprites…');

const idleParams = (i, n = 32) => ({ pose: 'stand', a: (i / n) * 2 * TAU, ma: (i / n) * TAU, bob: Math.sin((i / n) * 2 * TAU) > 0.3 ? 1 : 0, near: 0, far: 0 });
const sitParams = (i, n = 24) => ({ pose: 'sit', a: (i / n) * 2 * TAU, ma: (i / n) * TAU, bob: Math.sin((i / n) * 2 * TAU) > 0.3 ? 1 : 0 });
const idleGrids = [...Array(32)].map((_, i) => knight(idleParams(i)));
const sitGrids = [...Array(24)].map((_, i) => knight(sitParams(i)));
save('knight-idle.gif', encodeGIF(idleGrids.map((g) => ({ grid: g.scale(4), delay: 11 })), { transparent: true }));

const walkParams = (t, n = 64) => {
  const ph = ((t % 16) / 16) * TAU, near = Math.round(Math.sin(ph) * 2), c = Math.cos(ph);
  return { pose: 'walk', a: ph, trail: 2, near, far: -near, liftN: c > 0.3 ? 1 : 0, liftF: c < -0.3 ? 1 : 0, bob: Math.abs(near) <= 1 ? -1 : 0, ma: (t / n) * TAU };
};
save('knight-walk.gif', encodeGIF([...Array(48)].map((_, t) => ({ grid: knight(walkParams(t, 48)).scale(4), delay: 6 })), { transparent: true }));
function benchScene(i, n) {
  const W = 120, H = 64, GROUND = 56, g = new Grid(W, H), a = (i / n) * TAU;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y < 18 ? 'k' : y < 36 ? 'K' : 'm';
    if ((y === 17 || y === 35) && (x + y) % 2) c = y === 17 ? 'K' : 'm';
    g.set(x, y, y >= GROUND ? (y === GROUND ? 'e' : 'G') : c);
  }
  for (let x = 0; x < W; x++) for (let y = 0; y < 3 + Math.round(4 * Math.abs(Math.sin(x * 0.21)) * (x % 7 < 4)); y++) g.set(x, y, 'F');
  // lueur douce autour du banc (pulse)
  const cx = 60, cy = 40, R = 30 + Math.round(Math.sin(a) * 2);
  for (let y = 0; y < GROUND; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - cx, (y - cy) * 1.3); if (d > R) continue;
    const v = g.get(x, y);
    if (v === C('k') || v === C('K')) g.set(x, y, (x + y) % 2 ? 'm' : v);
    else if (v === C('m') && d < R * 0.6 && (x + y) % 2) g.set(x, y, 'f');
  }
  for (const [x, h] of [[18, 2], [19, 3], [27, 1], [88, 2], [89, 3], [90, 1], [101, 2]]) for (let y = 1; y <= h; y++) g.set(x + (y === h && i % 6 < 3 ? 1 : 0), GROUND - y, 't');
  const bx = 29, by = GROUND - 21;
  g.blit(bench(), bx, by);
  g.blit(knight(sitParams(i, n)), bx + 16, by + 12 - 32);
  const r = rng(11);
  for (let m = 0; m < 12; m++) {
    const x0 = r() * W, y0 = r() * H, ph = r() * TAU;
    const y = Math.floor((((y0 - (i * H) / n) % H) + H) % H), x = Math.round(x0 + Math.sin(a + ph) * 2);
    if ((i + m * 3) % 12 < 6) { g.set(x, y, 'o'); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (g.get(x + dx, y + dy) !== C('o')) g.set(x + dx, y + dy, 'O'); }
    else g.set(x, y, 'O');
  }
  return g;
}
// save('bench-rest.gif', encodeGIF([...Array(24)].map((_, i) => ({ grid: benchScene(i, 24).scale(4), delay: 12 }))));
save('crawler.gif', encodeGIF([0, 1].map((p) => ({ grid: beetle(p).scale(5), delay: 18 })), { transparent: true }));

/* --------------------------------------------- scène : traversée des cavernes */
function scene(t, W = 200, H = 64) {
  const g = new Grid(W, H);
  const GROUND = 56;
  // fond dégradé tramé
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y < 18 ? 'k' : y < 36 ? 'K' : 'm';
    if ((y === 17 || y === 35) && (x + y) % 2) c = y === 17 ? 'K' : 'm';
    g.set(x, y, c);
  }
  // flèches lointaines (parallaxe lente, période 32)
  const far = Math.floor(t / 2);
  for (let x = 0; x < W; x++) {
    const u = (((x + far) % 32) + 32) % 32;
    const spires = [{ o: 3, w: 6, top: 24 }, { o: 19, w: 4, top: 34 }];
    for (const s of spires) {
      if (u < s.o || u >= s.o + s.w) continue;
      const mid = s.o + (s.w - 1) / 2, dx = Math.abs(u - mid);
      const top = s.top + Math.round(dx * 2.2) - 3;
      for (let y = Math.max(0, top); y < GROUND; y++) g.set(x, y, 'f');
      if (Math.abs(u - mid) < 1 && s.w > 4) { g.set(x, s.top + 5, (Math.floor(t / 8) % 3) ? 'W' : 'w'); g.set(x, s.top + 6, 'w'); }
    }
  }
  // stalactites (période 64, vitesse 1)
  const stal = [{ o: 5, w: 7, len: 10 }, { o: 21, w: 3, len: 5 }, { o: 33, w: 9, len: 13 }, { o: 51, w: 4, len: 7 }];
  for (let x = 0; x < W; x++) {
    const u = (((x + t) % 64) + 64) % 64;
    for (let y = 0; y < 3; y++) g.set(x, y, 'F');
    for (const s of stal) {
      const mid = s.o + s.w / 2, dx = Math.abs(u + 0.5 - mid);
      if (dx > s.w / 2) continue;
      const len = Math.round(s.len * (1 - dx / (s.w / 2)) ** 0.8);
      for (let y = 3; y < 3 + len; y++) g.set(x, y, 'F');
    }
  }
  // sol + herbes (période 64, vitesse 1)
  for (let x = 0; x < W; x++) {
    const u = (((x + t) % 64) + 64) % 64;
    for (let y = GROUND; y < H; y++) g.set(x, y, y === GROUND ? 'e' : 'G');
    if ((u * 7) % 11 === 0) g.set(x, GROUND + 2 + (u % 3), 'e');
    const tuft = [[4, 2], [5, 3], [6, 1], [17, 1], [29, 2], [30, 3], [31, 2], [44, 1], [45, 2], [58, 3], [59, 1]];
    for (const [o, hgt] of tuft) if (u === o) for (let y = 1; y <= hgt; y++) g.set(x + (y === hgt && (t >> 2) % 2 ? 1 : 0), GROUND - y, 't');
  }
  // halo de la lanterne sur le décor
  const wx = 60, wy = GROUND - 39;
  const p = walkParams(t), hero = knight(p);
  const lcx = wx + hero.lantern.x, lcy = wy + hero.lantern.y, R = 11;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - lcx, y - lcy); if (d > R) continue;
    const v = g.get(x, y);
    if (v === C('k') || v === C('K')) g.set(x, y, (x + y) % 2 ? 'm' : v);
    else if (v === C('m')) g.set(x, y, (x + y) % 2 && d < R * 0.6 ? 'f' : 'm');
    else if (v === C('f')) g.set(x, y, d < R * 0.55 ? 'F' : 'f');
    else if (v === C('e')) g.set(x, y, 't');
  }
  // spores flottantes (bouclent sur 64 frames)
  const r = rng(7);
  for (let i = 0; i < 18; i++) {
    const x0 = r() * W, y0 = r() * H, k = 1 + Math.floor(r() * 2), ph = r() * 6.28;
    const y = Math.floor((((y0 - (t * H * k) / 64) % H) + H) % H);
    const x = Math.round(x0 + Math.sin((t / 64) * 6.283 * k + ph) * 2);
    const bright = (t + i * 5) % 16 < 8;
    if (bright) { g.set(x, y, 'o'); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (g.get(x + dx, y + dy) !== C('o')) g.set(x + dx, y + dy, 'O'); }
    else g.set(x, y, 'O');
  }
  // personnages
  g.blit(hero, wx, wy);
  g.blit(beetle(Math.floor(t / 3) % 2), 132, GROUND + 1 - 11);
  return g;
}
save('cavern-walk.gif', encodeGIF([...Array(64)].map((_, t) => ({ grid: scene(t).scale(4), delay: 9 }))));

/* ------------------------------------------------------------ bannière SVG */
function banner() {
  const W = 1280, H = 420, r = rng(42);
  // flèches gothiques
  const spires = (n, base, minH, maxH, fill, seedLit) => {
    let s = '', lit = '';
    for (let i = 0; i < n; i++) {
      const w = 18 + r() * 46, x = (i / n) * W + r() * 60 - 30, h = minH + r() * (maxH - minH), top = base - h, tip = top - w * (1.4 + r());
      s += `<path d="M${x},${base}V${top}L${x + w * 0.18},${top - w * 0.35}L${x + w / 2},${tip}L${x + w * 0.82},${top - w * 0.35}L${x + w},${top}V${base}Z"/>`;
      if (seedLit && r() < 0.55) {
        const wy = top + 14 + r() * h * 0.4;
        lit += `<rect class="win" style="animation-delay:-${(r() * 6).toFixed(2)}s" x="${(x + w / 2 - 3).toFixed(1)}" y="${wy.toFixed(1)}" width="6" height="11" rx="3"/>`;
      }
    }
    return `<g fill="${fill}">${s}</g>${lit}`;
  };
  // stalactites
  let st = `M0,0H${W}V24`;
  for (let x = W; x > 0;) { const w = 16 + r() * 50, l = 18 + r() * (r() < 0.2 ? 110 : 45); st += `L${x - w / 2},${24 + l}L${x - w},24`; x -= w; }
  st += 'Z';
  // sol
  let ground = `M0,${H}`;
  for (let x = 0; x <= W; x += 40) ground += `L${x},${372 + Math.sin(x / 90) * 6 + r() * 6}`;
  ground += `L${W},${H}Z`;
  let grass = '';
  for (let i = 0; i < 70; i++) {
    const x = r() * W, h = 8 + r() * 18, y = 376 + Math.sin(x / 90) * 6;
    grass += `<path class="blade" style="animation-delay:-${(r() * 4).toFixed(2)}s" d="M${x.toFixed(1)},${y + 6}q${(r() * 6 - 3).toFixed(1)},-${(h / 2).toFixed(1)} ${(r() * 8 - 4).toFixed(1)},-${h.toFixed(1)}"/>`;
  }
  // spores
  let motes = '';
  for (let i = 0; i < 46; i++) {
    const x = r() * W, y = 120 + r() * 300, rad = 0.8 + r() * 2.2, d = 7 + r() * 10;
    motes += `<circle class="mote" style="animation-duration:${d.toFixed(1)}s;animation-delay:-${(r() * d).toFixed(1)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}"/>`;
  }
  // banc + chevalier assis (pixel art) + scarabée
  const k = 5, bx = 930, by = 384 - 22 * k;
  const wx = bx + 16 * k, wy = by + (12 - 32) * k;
  const wf = svgFrames(sitGrids, k, 3.6, 'w');
  const bf = svgFrames([beetle(0), beetle(1)], 4, 0.36, 'b');
  const benchSvg = gridToRects(bench(), k);
  const lanternX = wx + (sitGrids[0].lantern.x + 0.5) * k, lanternY = wy + (sitGrids[0].lantern.y + 0.5) * k;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03050b"/><stop offset=".55" stop-color="#0a1022"/><stop offset="1" stop-color="#121b36"/></linearGradient>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7fdcff" stop-opacity=".28"/><stop offset="1" stop-color="#7fdcff" stop-opacity="0"/></radialGradient>
  <radialGradient id="lamp" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#bff1ff" stop-opacity=".55"/><stop offset=".35" stop-color="#7fdcff" stop-opacity=".18"/><stop offset="1" stop-color="#7fdcff" stop-opacity="0"/></radialGradient>
  <filter id="glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="soft"><feGaussianBlur stdDeviation="1.2"/></filter>
  <filter id="fog" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
</defs>
<style>
  .mote{fill:#bff1ff;filter:url(#soft);animation:rise linear infinite}
  @keyframes rise{0%{transform:translateY(0);opacity:0}15%{opacity:.9}80%{opacity:.6}100%{transform:translateY(-170px);opacity:0}}
  .win{fill:#7fdcff;opacity:.15;animation:flick 6s ease-in-out infinite}
  @keyframes flick{0%,100%{opacity:.08}40%{opacity:.55}60%{opacity:.25}}
  .fog{animation:drift 26s ease-in-out infinite alternate}
  .fog2{animation:drift 34s ease-in-out infinite alternate-reverse}
  @keyframes drift{from{transform:translateX(-90px)}to{transform:translateX(90px)}}
  .blade{fill:none;stroke:#2a3760;stroke-width:2.2;stroke-linecap:round;transform-box:fill-box;transform-origin:50% 100%;animation:sway 4s ease-in-out infinite}
  @keyframes sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}
  .lamp{transform-box:fill-box;transform-origin:center;animation:pulse 2.56s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:.75;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}
  .title{animation:breathe 6s ease-in-out infinite}
  @keyframes breathe{0%,100%{opacity:.88}50%{opacity:1}}
  .crawl{animation:crawl 38s linear infinite}
  @keyframes crawl{from{transform:translateX(-120px)}to{transform:translateX(${W + 40}px)}}
  ${wf.css}${bf.css}
</style>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<ellipse cx="640" cy="190" rx="520" ry="170" fill="url(#halo)"/>
${spires(16, H, 120, 260, '#0d1429', true)}
<ellipse class="fog" cx="420" cy="300" rx="420" ry="50" fill="#9fc3ea" opacity=".07" filter="url(#fog)"/>
${spires(11, H, 50, 150, '#080d1c', false)}
<ellipse class="fog2" cx="900" cy="345" rx="460" ry="40" fill="#9fc3ea" opacity=".06" filter="url(#fog)"/>
<path d="${st}" fill="#02030a"/>
<g>${motes}</g>
<g class="title" transform="translate(-70,0)" text-anchor="middle" font-family="Cinzel, 'Trajan Pro', 'Cormorant Garamond', Garamond, Georgia, serif">
  <text x="640" y="118" font-size="22" letter-spacing="6" fill="#8fa3c7" font-style="italic">${esc(CONFIG.greeting)}</text>
  <text x="640" y="212" font-size="88" letter-spacing="12" fill="#eef4ff" filter="url(#glow)">${esc(CONFIG.name)}</text>
  <g stroke="#7f93ba" stroke-width="1.5" fill="none" opacity=".8">
    <path d="M340,246H600M680,246H940"/><path d="M640,236l10,10l-10,10l-10,-10z" fill="#bff1ff" stroke="none"/>
    <path d="M600,246c8,-10 18,-10 20,0M680,246c-8,-10 -18,-10 -20,0"/>
  </g>
  <text x="640" y="294" font-size="25" letter-spacing="4" fill="#a9bad8">${esc(CONFIG.tagline)}</text>
</g>
<path d="${ground}" fill="#04060e"/>
<g>${grass}</g>
<ellipse cx="${bx + 31 * k}" cy="${by + 21 * k}" rx="180" ry="10" fill="#000" opacity=".45"/>
<circle class="lamp" cx="${lanternX}" cy="${lanternY}" r="110" fill="url(#lamp)" opacity=".7"/>
<g transform="translate(${bx},${by})" shape-rendering="crispEdges">${benchSvg}</g>
<g transform="translate(${wx},${wy})" shape-rendering="crispEdges">${wf.body}</g>
<g class="crawl"><g transform="translate(0,${376 - 11 * 4 + 4})" shape-rendering="crispEdges">${bf.body}</g></g>
</svg>`;
}

function divider() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 48" width="900" height="48">
<defs>
  <linearGradient id="l" x1="0" x2="1"><stop offset="0" stop-color="#7f93ba" stop-opacity="0"/><stop offset=".5" stop-color="#7f93ba"/><stop offset="1" stop-color="#7f93ba" stop-opacity="0"/></linearGradient>
  <filter id="g" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<style>.core{transform-box:fill-box;transform-origin:center;animation:p 3s ease-in-out infinite}@keyframes p{0%,100%{opacity:.6;transform:scale(.85)}50%{opacity:1;transform:scale(1.1)}}</style>
<path d="M40,24H405M495,24H860" stroke="url(#l)" stroke-width="1.5"/>
<g fill="none" stroke="#9fb0d0" stroke-width="1.6" stroke-linecap="round">
  <path d="M405,24c10,0 14,-12 24,-12c-8,0 -10,8 -4,10"/><path d="M405,24c10,0 14,12 24,12c-8,0 -10,-8 -4,-10"/>
  <path d="M495,24c-10,0 -14,-12 -24,-12c8,0 10,8 4,10"/><path d="M495,24c-10,0 -14,12 -24,12c8,0 10,-8 4,-10"/>
</g>
<path d="M450,10l14,14l-14,14l-14,-14z" fill="none" stroke="#c9d6ee" stroke-width="1.6"/>
<circle class="core" cx="450" cy="24" r="5" fill="#bff1ff" filter="url(#g)"/>
</svg>`;
}

console.log('Génération des SVG…');
save('banner.svg', banner());
save('divider.svg', divider());

/* ------------------------------------------------------------------ README */
const u = CONFIG.username;
const v = Date.now().toString(36);   // anti-cache : change à chaque génération
const statTheme = 'bg_color=0b0f1e&title_color=e9f6ff&text_color=b9c2d6&icon_color=7fdcff&border_color=2b3150&ring_color=7fdcff';
const readme = `<p align="center">
  <img src="assets/banner.svg?v=${v}" width="100%" alt="${esc(CONFIG.name)} — ${esc(CONFIG.tagline)}"/>
</p>

<p align="center"><img src="assets/divider.svg?v=${v}" width="70%" alt=""/></p>

<img src="assets/knight-idle.gif?v=${v}" align="right" width="136" alt="Le petit chevalier, en pixel art"/>

### ✦ Le carnet du vagabond

${CONFIG.about.map(([e, t]) => `- ${e} ${t}`).join('\n')}

<br clear="right"/>

<p align="center"><img src="assets/divider.svg?v=${v}" width="70%" alt=""/></p>

### ✦ Arsenal

<p align="center">
  <img src="https://skillicons.dev/icons?i=${CONFIG.skills}&theme=dark" alt="Compétences"/>
</p>

<p align="center"><img src="assets/divider.svg?v=${v}" width="70%" alt=""/></p>

### ✦ Journal des profondeurs

<p align="center">
  <img height="165" src="https://github-readme-stats.vercel.app/api?username=${u}&show_icons=true&hide_border=false&${statTheme}" alt="Stats GitHub"/>
  <img height="165" src="https://github-readme-stats.vercel.app/api/top-langs/?username=${u}&layout=compact&${statTheme}" alt="Langages"/>
</p>

<p align="center">
  <img src="assets/cavern-walk.gif?v=${v}" width="100%" alt="Le petit chevalier traverse une caverne derrière un scarabée"/>
</p>

<p align="center"><i>${esc(CONFIG.footer)}</i></p>
`;
fs.writeFileSync(path.join(__dirname, 'README.md'), readme);
console.log('  README.md');
console.log('Terminé.');
