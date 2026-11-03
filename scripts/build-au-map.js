#!/usr/bin/env node
// Builds the map's generated files from the inputs in scripts/data/ (see its README.md): the world, drawn in detail
// around Australia, and the NBN points of interconnect.
//
//   node scripts/build-au-map.js --extract NE_10M_LAND.geojson   clip Natural Earth to the map, write scripts/data/ne10m-land-au.json
//   node scripts/build-au-map.js                                  write the generated files under src/game/20-world/
//   node scripts/build-au-map.js --check                          fail if they differ from what the inputs give
//
// No dependencies: Sutherland-Hodgman clipping and Douglas-Peucker simplification are a few lines each.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(__dirname, 'data');
const LAND = path.join(DATA, 'ne10m-land-au.json');
const WORLD = path.join(DATA, 'world-coast-50m.json');
const POIS = path.join(DATA, 'nbn-pois.csv');
const OUT = {
  coast: path.join(ROOT, 'src', 'game', '20-world', '30-coastline.js'),
  pois: path.join(ROOT, 'src', 'game', '20-world', '45-pois.js'),
};
// The detailed frame, [west, south, east, north]: Australia, its seas and near neighbours, from Natural Earth 1:10m.
// Outside it the coarser world coastline is drawn.
const BOX = [95, -48, 180, 16];
// Natural Earth, pinned (https://github.com/nvkelso/natural-earth-vector, public domain).
const NE_COMMIT = 'ca96624a56bd078437bca8184e78163e5039ad19';

const die = (m) => { console.error('error: ' + m); process.exit(1); };
const r3 = (v) => Math.round(v * 1000) / 1000;
const r2 = (v) => Math.round(v * 100) / 100;

// Signed area of a lon/lat ring, in square degrees.
function area(ring) { let a = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]); return a / 2; }

// Sutherland-Hodgman: a polygon ring clipped to the box, one edge at a time.
function clip(ring, [w, s, e, n]) {
  const edges = [
    [(p) => p[0] >= w, (a, b) => [w, a[1] + (b[1] - a[1]) * (w - a[0]) / (b[0] - a[0])]],
    [(p) => p[0] <= e, (a, b) => [e, a[1] + (b[1] - a[1]) * (e - a[0]) / (b[0] - a[0])]],
    [(p) => p[1] >= s, (a, b) => [a[0] + (b[0] - a[0]) * (s - a[1]) / (b[1] - a[1]), s]],
    [(p) => p[1] <= n, (a, b) => [a[0] + (b[0] - a[0]) * (n - a[1]) / (b[1] - a[1]), n]],
  ];
  let out = ring;
  for (const [inside, cut] of edges) {
    const pts = out; out = [];
    if (!pts.length) break;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i + pts.length - 1) % pts.length], b = pts[i];
      if (inside(b)) { if (!inside(a)) out.push(cut(a, b)); out.push(b); }
      else if (inside(a)) out.push(cut(a, b));
    }
  }
  return out;
}

// Douglas-Peucker on an open polyline; tol(p) gives the tolerance (degrees) at a point.
function simplify(pts, tol) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i0, i1] = stack.pop(), [ax, ay] = pts[i0], [bx, by] = pts[i1], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-12;
    let best = -1, bd = 0;
    for (let i = i0 + 1; i < i1; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L; const t = tol(pts[i]); if (d > t && d / t > bd) { bd = d / t; best = i; } }
    if (best > 0) { keep[best] = 1; stack.push([i0, best], [best, i1]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// A closed ring: split at its farthest point so both halves have fixed ends.
function simplifyRing(ring, tol) {
  let far = 1, fd = 0; for (let i = 1; i < ring.length; i++) { const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]); if (d > fd) { fd = d; far = i; } }
  const a = simplify(ring.slice(0, far + 1), tol), b = simplify(ring.slice(far).concat([ring[0]]), tol);
  return a.concat(b.slice(1, -1));
}

function extract(file) {
  const buf = fs.readFileSync(file), sha = crypto.createHash('sha256').update(buf).digest('hex');
  const gj = JSON.parse(buf.toString('utf8')), rings = [];
  for (const f of gj.features) {
    const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const poly of polys) {
      const outer = poly[0]; // holes (lakes) are not drawn
      let w = 180, s = 90, e = -180, n = -90; for (const [x, y] of outer) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
      if (e < BOX[0] || w > BOX[2] || n < BOX[1] || s > BOX[3]) continue;
      const open = outer.slice(0, -1), c = clip(open, BOX);
      if (c.length < 3 || Math.abs(area(c)) < 0.0005) continue; // islets under about 6 km²
      // Light pre-simplification (about 200 m): the file stays small, the build simplifies further.
      const s0 = simplifyRing(c, () => 0.002).map(([x, y]) => [r3(x), r3(y)]);
      if (s0.length >= 3) rings.push(s0);
    }
  }
  rings.sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)));
  const out = { source: 'Natural Earth 1:10m land (public domain)', commit: NE_COMMIT, file: 'geojson/ne_10m_land.geojson', sha256: sha, box: BOX, rings };
  fs.writeFileSync(LAND, JSON.stringify(out).replace(/\]\],\[\[/g, ']],\n[[') + '\n');
  console.log(`wrote ${path.relative(ROOT, LAND)}: ${rings.length} rings, ${rings.reduce((a, r) => a + r.length, 0)} points`);
}

function readPois() {
  const lines = fs.readFileSync(POIS, 'utf8').trim().split('\n'), head = lines.shift().split(',');
  return lines.map((l) => { const v = l.split(','), o = {}; head.forEach((k, i) => { o[k] = v[i]; }); return o; });
}

// The generated files, as {path: text}.
function generate() {
  if (!fs.existsSync(LAND)) die(`${path.relative(ROOT, LAND)} is missing: run --extract first`);
  const land = JSON.parse(fs.readFileSync(LAND, 'utf8')), pois = readPois();
  // Coastline: tight (about 1 km) within a degree of a POI, looser (about 4 km) elsewhere, like the world map was.
  const near = (p) => pois.some((q) => Math.abs(p[0] - +q.lon) < 1 && Math.abs(p[1] - +q.lat) < 1);
  const coast = [];
  /* Two sources, no seams: a detailed ring is kept unless the box cut it (it touches the box's edge), and a world ring
     unless it lies wholly inside the box (the detailed one is drawn there). Land the box cuts through (Asia, Luzon,
     Fiji at 180°) is drawn whole from the world rings. */
  const onEdge = (r) => r.some(([x, y]) => x <= BOX[0] + 1e-6 || x >= BOX[2] - 1e-6 || y <= BOX[1] + 1e-6 || y >= BOX[3] - 1e-6);
  const inside = (r) => r.every(([x, y]) => x > BOX[0] && x < BOX[2] && y > BOX[1] && y < BOX[3]);
  for (const ring of JSON.parse(fs.readFileSync(WORLD, 'utf8')).rings) if (!inside(ring)) coast.push(ring);
  for (const ring of land.rings) {
    if (onEdge(ring)) continue;
    const a = Math.abs(area(ring));
    if (a < 0.003 && !ring.some(near)) continue; // small islands far from anything
    const s = simplifyRing(ring, (p) => (near(p) ? 0.01 : 0.04)).map(([x, y]) => [r2(x), r2(y)]);
    const d = s.filter((p, i) => i === 0 || p[0] !== s[i - 1][0] || p[1] !== s[i - 1][1]);
    if (d.length >= 3) coast.push(d);
  }
  const C = (rows) => rows.map((r) => JSON.stringify(r)).join(',\n');
  const banner = (what) => `// Generated by scripts/build-au-map.js from scripts/data/ (${what}). Do not edit: change the inputs and rebuild.\n`;
  const files = {};
  files[OUT.coast] = banner('Natural Earth 1:50m world land, and 1:10m around Australia, simplified') +
    '// Drawn coastline: lon/lat rings, tight around POIs and looser elsewhere.\n' +
    `const COAST_LL=[\n${C(coast)}\n];\n` +
    '// Projected, each ring kept in one piece where it crosses the seam (Greenland): the map repeats every W.\n' +
    'const COAST=COAST_LL.map(poly=>{let p=null;return poly.map(q=>{const r=proj(q[0],q[1]);if(p)r[0]+=W*Math.round((p[0]-r[0])/W);p=r;return r;});});\n';
  const ST = { ACT: 'act', NSW: 'nsw', NT: 'nt', QLD: 'qld', SA: 'sa', TAS: 'tas', VIC: 'vic', WA: 'wa' }, AREA = { metro: 'm', outer: 'o', regional: 'r' };
  const rows = pois.map((p) => {
    if (!ST[p.state] || !AREA[p.area]) die(`bad POI row ${p.id}`);
    return `{id:${JSON.stringify(p.id)},name:${JSON.stringify(p.name)},reg:'${ST[p.state]}',area:'${AREA[p.area]}',prem:${+p.premises},fsas:${+p.fsas},ll:[${+p.lon},${+p.lat}]}`;
  });
  files[OUT.pois] = banner('the ACCC list of 121 NBN points of interconnect') +
    '// One entry per POI: state, metro (m), outer metro (o) or regional (r), premises served, fibre serving areas, lon/lat.\n' +
    `const POIS=[\n ${rows.join(',\n ')},\n];\n`;
  return files;
}

module.exports = { generate, BOX };

const args = process.argv.slice(2);
if (require.main !== module) { /* required by a test */ }
else if (args[0] === '--extract') { if (!args[1]) die('--extract needs the Natural Earth file'); extract(args[1]); }
else {
  const files = generate();
  if (args.includes('--check')) {
    const stale = Object.entries(files).filter(([f, t]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== t).map(([f]) => path.relative(ROOT, f));
    if (stale.length) die(`out of date: ${stale.join(', ')} (run node scripts/build-au-map.js)`);
    console.log('map files are up to date');
  } else {
    for (const [f, t] of Object.entries(files)) { fs.writeFileSync(f, t); console.log(`wrote ${path.relative(ROOT, f)} (${t.length} bytes)`); }
  }
}
