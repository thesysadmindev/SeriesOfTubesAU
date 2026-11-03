const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

// Check the surveyed part independently against the original coastline segments.
// City markers may sit inland: their two short shore approaches are excluded.
// A surveyed route never crosses land.
function assertMarine(path, start, end, coast) {
  const at = p => path.findIndex(q => Math.abs(p[0] - q[0]) < 1e-8 && Math.abs(p[1] - q[1]) < 1e-8);
  const first = at(start), last = at(end);
  assert.ok(first >= 0 && last >= first, 'both shore approaches appear in the saved path');
  const edges = coast.flatMap(poly => poly.map((p, i) => [p, poly[(i + 1) % poly.length]]));
  const turn = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = first + 1; i <= last; i++) {
    const a = path[i - 1], b = [...path[i]];
    b[0] += 360 * Math.round((a[0] - b[0]) / 360);
    for (const [p, q] of edges) {
      const shift = 360 * Math.round((a[0] - p[0]) / 360), c = [p[0] + shift, p[1]], d = [q[0] + shift, q[1]];
      assert.ok(!(turn(a, b, c) * turn(a, b, d) < -1e-12 && turn(c, d, a) * turn(c, d, b) < -1e-12),
        `sea segment ${JSON.stringify([a, b])} crosses a coastline`);
    }
  }
}

test('surveyed designs avoid land, use real path lengths and improve latency', () => {
  const { ev, dom, errors } = load();
  try {
    const coast = JSON.parse(ev('JSON.stringify(COAST_LL)'));
    for (const [a, b] of [['akl', 'tyo'], ['per', 'akl'], ['mel', 'hba'], ['per', 'sin'], ['drw', 'hkg']]) {
      const quotes = JSON.parse(ev(`JSON.stringify(Object.keys(SEA_DESIGNS).map(d=>seaQuote('${a}','${b}',d)))`));
      for (let i = 0; i < quotes.length; i++) {
        const q = quotes[i];
        assert.ok(Number.isFinite(q.km) && q.pts.length > 2);
        // the fastest design may follow the corridor of an existing cable instead, which is drawn as that cable is
        if (!q.cor) assertMarine(q.pts, ...q.shore, coast);
        assert.equal(q.km, ev(`seaLength(${JSON.stringify(q.pts)})`));
        if (i) {
          assert.ok(q.km <= quotes[i - 1].km, 'premium surveys never lengthen the route');
          assert.ok(q.ms < quotes[i - 1].ms, 'premium latency is strictly lower');
          assert.ok(q.cost > quotes[i - 1].cost && q.days > quotes[i - 1].days);
        }
      }
      const reverse = JSON.parse(ev(`JSON.stringify(seaQuote('${b}','${a}'))`));
      assert.equal(reverse.km, quotes[0].km);
      assert.deepEqual(reverse.pts, [...quotes[0].pts].reverse(), 'reverse direction uses the same survey');
    }
    assert.equal(ev("cablesFor('per','akl').length"), 0, 'route works without an existing cable');
    assert.ok(ev("seaQuote('per','akl').km > kmBetween('per','akl')*1.03"), 'the route goes round the continent, not across it');
    // Perth to Sydney sails round the south coast, through the Great Australian Bight
    assert.ok(ev("seaQuote('per','syd').pts.some(p=>p[1]<-35&&p[0]>125&&p[0]<135)"), 'the route crosses the Bight');
    assert.equal(JSON.stringify(ev("subNeed(ownCabKm('per','sin'))")), '[]', 'no upgrades needed for Perth–Singapore');
    assert.deepEqual(errors, []);
  } finally { dom.window.close(); }
});

test('grid edges and smoothing cannot jump across a thin island', () => {
  const { ev, dom } = load();
  try {
    // A thin island at 150°E on the equator, inside the grid, between two cells a quarter degree apart.
    ev('COAST_LL.length=0;COAST_LL.push([[150.09,-0.1],[150.16,-0.1],[150.16,0.1],[150.09,0.1]])');
    assert.equal(ev('seaLand(150,0)||seaLand(150.25,0)'), false, 'both grid endpoints are water');
    assert.equal(ev('seaClear([150,0],[150.25,0])'), false, 'exact coastline check catches the island between them');
    assert.deepEqual(JSON.parse(ev('JSON.stringify(seaPoint(seaRow(0)*SEA_NAV.nx+seaCol(150)))')), [150, 0]);
    assert.equal(ev('seaStep(seaRow(0)*SEA_NAV.nx+seaCol(150),1,0)'), false, 'the grid step also catches it');
    assert.equal(ev('seaClear([150,-0.25],[150.25,-0.25])'), true, 'open water remains traversable');
  } finally { dom.window.close(); }
});

test('orders, previews, saved paths and map geometry agree; legacy cables retain their values', () => {
  const { ev, dom, errors } = load();
  try {
    ev("ACT.start({});S.cash=1e11;S.lvl=13;S.won=true;for(const g of GOALS)S.done[g.id]=0;for(const city of ['akl','tyo'])ACT.buildPop({city});UI.lmode='df';UI.dfSrc='cable';openLinkModal('akl','tyo')");
    for (const design of ['standard', 'optimized', 'express']) {
      const q = JSON.parse(ev(`JSON.stringify(seaQuote('akl','tyo','${design}'))`));
      assert.ok(dom.window.document.getElementById('modalCard').textContent.includes(q.ms.toFixed(1) + ' ms one-way'));
      ev(`UI.pending={a:'akl',b:'tyo'};UI.seaDesign='${design}';ACT.orderCable()`);
      const l = JSON.parse(ev('JSON.stringify(S.links.at(-1))'));
      assert.deepEqual(l.seaPath, q.pts);
      assert.equal(l.km, q.km);
      assert.equal(l.paid, q.cost);
      assert.equal(l.ready - l.day, q.days);
      assert.equal(ev('linkLat(S.links.at(-1))'), q.ms);
      ev('S=migrate(JSON.parse(JSON.stringify(S)));GEO.clear()');
      assert.deepEqual(JSON.parse(ev('JSON.stringify(S.links.at(-1).seaPath)')), q.pts);
      assert.deepEqual(JSON.parse(ev('JSON.stringify(linkGeom(S.links.at(-1)).pts)')),
        JSON.parse(ev("JSON.stringify(seaMapPoints(S.links.at(-1).seaPath,'akl','tyo'))")));
      ev("UI.dfSrc='cable';openLinkModal('akl','tyo')");
    }
    ev("S.links.push({id:'legacy',a:'akl',b:'tyo',kind:'df',own:true,sub:true,seaDesign:'optimized',sys:'roadm',km:7515,ch:[],ready:0,mo:1,cut:0});S=migrate(JSON.parse(JSON.stringify(S)))");
    assert.equal(ev('S.links.at(-1).seaPath'), undefined);
    assert.equal(ev('S.links.at(-1).km'), 7515);
    assert.equal(ev('linkLat(S.links.at(-1))'), 37.575);
    ev('S.links.at(-1).seaPath=[[0,0],[NaN,1]];S=sanitize(S)');
    assert.equal(ev('S.links.at(-1).seaPath'), undefined, 'invalid path data is discarded');
    assert.deepEqual(errors, []);
  } finally { dom.window.close(); }
});

test('your own cable is drawn right up to both cities, even one drawn nudged off its spot', () => {
  const { ev, dom, errors } = load();
  try {
    // Sydney is drawn a few pixels off its real spot (CITY_NUDGE), which deep zoom makes a wide gap.
    assert.notDeepEqual(JSON.parse(ev('JSON.stringify(CITY_NUDGE.syd)')), [0, 0]);
    const path = JSON.stringify(ev("JSON.stringify(seaRoutes('syd','akl')[0].pts)"));
    for (const [a, b] of [['syd', 'akl'], ['akl', 'syd']]) {
      ev(`ACT.start({});S.links.push({id:'own',a:'${a}',b:'${b}',kind:'df',own:true,sub:true,seaDesign:'standard',seaPath:JSON.parse(${path}),sys:'roadm',km:2200,ch:[],ready:0,mo:1,cut:0});GEO.clear()`);
      const g = JSON.parse(ev("JSON.stringify(linkGeom(S.links.find(l=>l.id==='own')).pts)"));
      const at = (p, c) => Math.hypot(p[0] - ev(`CITY.${c}.x`), p[1] - ev(`CITY.${c}.y`));
      const [s, e] = [g[0], g[g.length - 1]];
      assert.ok(Math.min(at(s, 'syd') + at(e, 'akl'), at(s, 'akl') + at(e, 'syd')) < 1e-6, `${a}–${b}: the line starts and ends at the cities as drawn`);
    }
    assert.deepEqual(errors, []);
  } finally { dom.window.close(); }
});

test('failed surveys refuse construction instead of falling back to a line through land', () => {
  const { ev, dom } = load();
  try {
    ev("ACT.start({});S.cash=1e11;S.won=true;SEA_NAV.routes.set('akl|tyo',[]);UI.pending={a:'akl',b:'tyo'}");
    assert.match(ev("ownCabWhy('akl','tyo')"), /No navigable sea route/);
    const count = ev('S.links.length'), cash = ev('S.cash');
    ev('ACT.orderCable()');
    assert.equal(ev('S.links.length'), count);
    assert.equal(ev('S.cash'), cash);
  } finally { dom.window.close(); }
});

test('background surveys deduplicate requests and do not replace a later dialog', () => {
  const { ev, dom } = load();
  try {
    ev(`window.Worker=class{constructor(){window.surveyWorker=this;this.requests=[];}postMessage(m){this.requests.push(m);}terminate(){}};
      URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=()=>{};
      ACT.start({});S.won=true;S.cash=1e11;UI.lmode='df';UI.dfSrc='cable';openLinkModal('akl','tyo');`);
    assert.match(dom.window.document.getElementById('modalCard').textContent, /Surveying a sea route/);
    ev("ownCabWhy('tyo','akl')");
    assert.equal(ev('surveyWorker.requests.length'), 1, 'reverse-direction requests share a job');
    ev("openModal('<p id=otherDialog>Another dialog</p>');surveyWorker.onmessage({data:{key:'akl|tyo',routes:[]}})");
    assert.ok(dom.window.document.getElementById('otherDialog'), 'a completed survey cannot reopen a stale build dialog');
    assert.equal(ev('SEA_SURVEY.pending.size'), 0);
  } finally { dom.window.close(); }
});

test('the fastest design is as fast as the fastest cable', () => {
  const { ev, errors, dom } = load();
  try {
    // where a cable already runs, the low-latency design follows its corridor if that is shorter than its own survey
    for (const [a, b] of [['mel', 'hba'], ['syd', 'akl'], ['syd', 'sin']]) {
      const best = ev(`Math.min(...cablesFor('${a}','${b}').map(c=>linkLat({kind:'wave',km:c.km,cable:c.cid})))`);
      const q = JSON.parse(ev(`JSON.stringify(seaQuote('${a}','${b}','express'))`));
      assert.ok(q.ms <= best + 1e-9, `${a}–${b}: ${q.ms.toFixed(2)} ms against ${best.toFixed(2)} ms`);
      assert.equal(q.km, ev(`seaLength(${JSON.stringify(q.pts)})`), 'map and price use the same path');
    }
    // and where the existing cable takes a detour, the survey beats it
    assert.ok(ev("seaQuote('per','syd','express').ms") < ev("Math.min(...cablesFor('per','syd').map(c=>linkLat({kind:'wave',km:c.km,cable:c.cid})))"));
    assert.deepEqual(errors, []);
  } finally { dom.window.close(); }
});
test('the survey grid covers the map and its gateways, not the globe, and crosses the date line', () => {
  const { ev, errors, dom } = load();
  try {
    assert.ok(ev('SEA_NAV.nx*SEA_NAV.ny') < 300000, 'a box round Australia and the Pacific, not 360° × 160°');
    // Every landing city is inside, with room for the 16 cells a port search reaches, except the far ends of the long
    // cables (Oman, Europe, the US east coast): those are reached on the cables already there, never your own.
    const out = JSON.parse(ev("JSON.stringify(CITIES.filter(c=>landing(c.id)).filter(c=>{const x=seaCol(c.lon),y=seaRow(c.lat);return x<16||x>=SEA_NAV.nx-16||y<16||y>=SEA_NAV.ny-16;}).map(c=>c.id).sort())"));
    assert.deepEqual(out, ['iad', 'lon', 'mct', 'mrs'], 'landing cities near the edge');
    ev("ACT.start({});S.won=true");
    assert.match(ev("ownCabWhy('per','mct')"), /beyond the survey area/, 'no own cable to Oman');
    assert.equal(ev('seaWater(-1,100)||seaWater(SEA_NAV.nx,100)||seaWater(100,-1)||seaWater(100,SEA_NAV.ny)'), false, 'nothing outside the box is sea');
    // San Jose and Los Angeles lie past 180°: routes there still find water, from either side.
    for (const [a, b] of [['syd', 'sjc'], ['tyo', 'lax'], ['akl', 'lax']]) {
      const r = JSON.parse(ev(`JSON.stringify(seaRoutes('${a}','${b}').map(x=>x.km))`));
      assert.ok(r.length && r.every((km) => km > ev(`kmBetween('${a}','${b}')`) * 0.99), `${a}–${b}: ${r}`);
    }
    assert.deepEqual(errors, []);
  } finally { dom.window.close(); }
});
