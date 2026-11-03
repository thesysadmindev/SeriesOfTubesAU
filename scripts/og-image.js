// Draws site/images/og-image.png, the 1200×630 card link previews show: the real game on the Australian map with a
// small network on it, and the title card on top. Run it after `npm run build` whenever the name, the domain or the
// look of the map changes:
//   node scripts/og-image.js [--chrome PATH] [--out FILE] [--cam lon,lat,zoom]
// Needs playwright-core (a dev dependency) and Chrome: --chrome, PERF_CHROME, or the usual install paths.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const PAGE = path.join(ROOT, '_site', 'index.html');
const OUT = path.resolve(ROOT, opt('--out', 'site/images/og-image.png'));
// Where the map looks (the middle of the picture, in degrees): the south-east, from Adelaide to Brisbane with Tasmania
// below, right of the card.
const CAM = opt('--cam', '134.95,-35,1.2').split(',').map(Number);
const CHROME = opt('--chrome', process.env.PERF_CHROME) || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => fs.existsSync(p));

// Shown on the card. Keep in step with the page's own title and the domain (README, src/index.html).
const CARD = {
  tag: 'Australia',
  line: ['Run an Aussie ISP.', 'One tube at a time.'],
  chips: ['NBN POIs', 'Dark fibre', 'Peering', 'Racks'],
  hot: 'Backhoes',
  url: 'seriesoftubes.au',
};

// A small network in the south-east: the capitals joined up, Tasmania over both Bass Strait cables, a few NBN POIs
// with their NNIs, transit, exchanges and broadband, then a couple of months for the traffic to grow.
function build() {
  beginGame('Tubes', 'syd', { mode: 'sandbox' }); if (UI.pendGame) ACT.pitchSkip(); closeModal();
  S.cash = 1e10; S.lvl = 6; S.nextFail = 1e9; S.nextEvent = 1e9;
  const link = (a, b, tier, via) => { for (const c of [a, b]) if (!S.pops[c]) ACT.buildPop({ city: c }); for (const c of [a, b]) for (let k = 0; k < 3; k++) ACT.upRouter({ city: c }); UI.via = via || 'land'; UI.lmode = 'wave'; UI.route = 'diverse'; openLinkModal(a, b); ACT.buildLink({ tier }); closeModal(); };
  for (const c of ['syd', 'mel', 'bne', 'adl', 'cbr', 'hba']) ACT.buildPop({ city: c });
  link('syd', 'mel', 3); link('syd', 'bne', 2); link('syd', 'cbr', 1); link('cbr', 'mel', 1); link('mel', 'adl', 2);
  link('mel', 'hba', 1, 'bassline'); link('mel', 'hba', 1, 'ferry');
  for (const [p, hub] of [['2wol', 'syd'], ['2gos', 'syd'], ['2prt', 'syd'], ['3gee', 'mel'], ['3ben', 'mel'], ['3bal', 'mel'], ['4too', 'bne'], ['4sou', 'bne'], ['2que', 'cbr']]) {
    link(hub, p, 0); ACT.nniOrder({ city: p, t: 0 });
  }
  for (const c of ['syd', 'mel', 'bne']) { const n = NETS.find((x) => sellsAt(x, c)); if (n) ACT.buyTransit({ city: c, net: n.id, tier: 2 }); for (const x of ixIdsIn(c)) if (ixName(x)) { ACT.buyIx({ city: x, tier: 2 }); ACT.rs({ city: x }); } }
  ACT.dcLease({ city: 'syd', t: 0 });
  for (let d = 0; d < 30; d++) dayTick();
  for (const c of Object.keys(S.pops)) if (!S.pops[c].bb) ACT.launchBB({ city: c });
  for (let d = 0; d < 60; d++) dayTick();
  closeModal(); UI.sel = null; UI.leftOpen = false; FLOATS.length = 0; compute(); renderAll();
}

function card(c) {
  const logo = fs.readFileSync(path.join(ROOT, 'site', 'favicon.svg'), 'utf8').replace('<svg ', '<svg width="92" height="92" ');
  const chip = (t, hot) => `<span style="display:inline-block;padding:3px 12px;margin:0 8px 8px 0;border:3px solid #1E2640;border-radius:12px;background:${hot ? '#FFD23F' : '#EEF2F8'};font:800 18px Nunito,sans-serif">${t}</span>`;
  return `<div id="ogCard" style="position:fixed;left:38px;top:40px;width:500px;padding:30px 32px 26px;background:#fff;border:4px solid #1E2640;border-radius:26px;box-shadow:8px 8px 0 #1E2640;color:#1E2640;z-index:99">
    <div style="display:flex;align-items:center;gap:20px">${logo}<div style="font:800 64px/0.92 'Baloo 2',sans-serif;letter-spacing:-1px">Series<br>of <span style="color:#FF4F9A">Tubes</span></div></div>
    <div style="display:inline-block;margin:14px 0 0;padding:2px 14px;border-radius:10px;background:#16A866;color:#fff;font:800 22px 'Baloo 2',sans-serif;letter-spacing:1px;text-transform:uppercase">${c.tag}</div>
    <div style="margin:12px 0 14px;font:800 25px/1.3 Nunito,sans-serif">${c.line.join('<br>')}</div>
    <div>${c.chips.map((t) => chip(t)).join('')}${chip(c.hot, true)}</div>
    <div style="margin-top:8px;font:800 23px Nunito,sans-serif;color:#2F7BEA">${c.url}</div></div>`;
}

(async () => {
  if (!fs.existsSync(PAGE)) throw new Error('no _site/index.html: run npm run build first');
  if (!CHROME) throw new Error('no Chrome found: pass --chrome PATH or set PERF_CHROME');
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({ executablePath: CHROME });
  try {
    const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
    // The page itself, and the fonts it asks Google for; nothing else (no stats, no update checks).
    await page.route('**/*', (r) => { const u = r.request().url(); return u.startsWith('file:') || /fonts\.(googleapis|gstatic)\.com/.test(u) ? r.continue() : r.abort(); });
    // Seeded, and no animation loop: the picture is the same every run.
    await page.addInitScript(() => { window.__TUBES_TEST__ = true; let r = 4242; Math.random = () => { r = (r * 16807) % 2147483647; return r / 2147483647; }; });
    const errors = []; page.on('pageerror', (e) => errors.push(String(e.message || e)));
    await page.goto(pathToFileURL(PAGE).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(`(${build})()`);
    // Only the map: no HUD, side panels, tab bar or toasts.
    await page.addStyleTag({ content: 'body>*:not(#map):not(#ogCard){display:none!important}' });
    await page.evaluate(([lon, lat, z, html]) => { const [x, y] = proj0(lon, lat); cam.x = x; cam.y = y; cam.z = z; document.body.insertAdjacentHTML('beforeend', html); resize(); draw(performance.now()); }, [...CAM, card(CARD)]);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: OUT, type: 'png' });
    if (errors.length) throw new Error('page errors: ' + errors.join('; '));
    console.log(`wrote ${path.relative(ROOT, OUT)}`);
  } finally { await browser.close(); }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
