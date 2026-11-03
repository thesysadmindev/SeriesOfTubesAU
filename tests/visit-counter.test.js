// Visits are counted by country only: one plain request to GoatCounter when the page opens on the real site, and
// nothing else, nowhere else (docs/adr/0001-github-pages-only.md).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.join(__dirname, '..');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'tubes-counter-'));
execFileSync(process.execPath, ['scripts/build.js'], { cwd: root, stdio: 'pipe', env: { ...process.env, OUT, VERSION: '1.2.3', BUILD_DATE: '2026-11-04' } });
const html = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');

// Open the released page at a URL and record every fetch it makes while it starts.
function open(url) {
  const calls = [];
  const dom = new JSDOM(html, {
    url, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      w.fetch = (u, o) => { calls.push([String(u), o || {}]); return Promise.reject(new Error('offline')); };
      w.requestAnimationFrame = () => 0;
    },
  });
  dom.window.close();
  return calls.filter(([u]) => /goatcounter/.test(u));
}

test('the real site counts one visit, with nothing but the page', () => {
  for (const url of ['https://seriesoftubes.au/', 'https://www.seriesoftubes.au/']) {
    const c = open(url);
    assert.equal(c.length, 1, `${url}: one request`);
    const [u, o] = c[0], q = new URL(u);
    assert.equal(q.origin + q.pathname, 'https://thesysadmin.goatcounter.com/count');
    assert.deepEqual([...q.searchParams.keys()].sort(), ['p', 'rnd'], 'no title, referrer, screen size or event');
    assert.equal(q.searchParams.get('p'), '/');
    assert.equal(o.credentials, 'omit', 'no cookies');
    assert.equal(o.mode, 'no-cors');
  }
});

test('previews, the github.io copy and localhost count nothing, and the page loads no counter script', () => {
  for (const url of ['http://localhost:8080/', 'https://thesysadmindev.github.io/seriesoftubes/', 'https://tests.invalid/']) assert.deepEqual(open(url), [], url);
  assert.doesNotMatch(html, /gc\.zgo\.at|jsdelivr|ridiculytics/, 'no third-party script and no preconnect');
  assert.match(html, /Counts visits by country only, no cookies/);
});
