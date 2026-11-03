const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

function setup(t, opts) {
  const h = load(opts);
  t.after(() => h.dom.window.close());
  h.ev("ACT.start({});S.cash=1e8;for(const g of GOALS)S.done[g.id]=0;UI.speed=0;compute()");
  return h;
}

test('redundancy kit matches normal purchases, including cash, monthly costs and save reload', t => {
  const a = setup(t), b = setup(t);
  const quote = JSON.parse(a.ev("JSON.stringify(utilityKit('syd'))"));
  const cash = a.ev('S.cash'), monthly = a.ev('R.costMo');
  a.ev("ACT.utilityKit({city:'syd',cost:utilityKit('syd').cost})");
  b.ev("ACT.addGen({city:'syd'});ACT.addSite({city:'syd'});ACT.addRouter({city:'syd'})");
  for (const expr of ['S.pops.syd', 'R.cost'])
    assert.deepEqual(JSON.parse(a.ev(`JSON.stringify(${expr})`)), JSON.parse(b.ev(`JSON.stringify(${expr})`)));
  assert.equal(a.ev('S.cash'), cash - quote.cost);
  assert.equal(a.ev('S.cash'), b.ev('S.cash'));
  assert.equal(a.ev('R.costMo'), monthly + quote.mo);
  const before = a.ev('JSON.stringify(S)');
  a.ev("ACT.utilityKit({city:'syd',cost:0})");
  assert.equal(a.ev('JSON.stringify(S)'), before, 'repeat does not buy more hardware');
  a.ev("save();S=migrate(JSON.parse(slotRaw(UI.slot)));compute()");
  assert.equal(a.ev('S.pops.syd.gen && S.pops.syd.site2 && S.pops.syd.routers===2'), true);
  assert.deepEqual(a.errors, []);
  assert.deepEqual(b.errors, []);
});

test('kit is all-or-nothing, rejects stale quotes and handles missing PoPs', t => {
  const { ev, errors } = setup(t);
  ev("window.quote=utilityKit('syd').cost;S.cash=quote-1");
  const before = ev('JSON.stringify(S.pops.syd)');
  ev("ACT.utilityKit({city:'syd',cost:quote})");
  assert.equal(ev('JSON.stringify(S.pops.syd)'), before);
  assert.equal(ev('S.cash'), ev('quote-1'));
  ev("S.cash=1e8;ACT.utilityKit({city:'syd',cost:quote+1,modal:true})");
  assert.equal(ev('JSON.stringify(S.pops.syd)'), before);
  assert.match(ev("document.getElementById('modalCard').textContent"), /quote changed/);
  ev("ACT.utilityKit({city:'not-a-city',cost:0});ACT.utilityKit({city:'mel',cost:0})");
  assert.deepEqual(errors, []);
});

test('kit buys only missing components and preserves extra routers and service placement', t => {
  const { ev, errors } = setup(t);
  ev("S.pops.syd.routers=4;S.pops.syd.gen=true;S.pops.syd.rgen=3;S.transit.push({id:'test',city:'syd',net:'cog',tier:0,site:'a'});compute()");
  const cash = ev('S.cash');
  assert.equal(ev("utilityKit('syd').cost"), ev('SITE2_COST'));
  ev("ACT.utilityKit({city:'syd',cost:utilityKit('syd').cost})");
  assert.equal(ev('S.cash'), cash - ev('SITE2_COST'));
  assert.equal(ev('S.pops.syd.routers'), 4);
  assert.equal(ev('S.pops.syd.rgen'), 3);
  assert.equal(ev('S.transit[0].site'), 'a');
  assert.deepEqual(errors, []);
});

test('bulk peering covers rival IXs, respects policy and is idempotent', t => {
  const { ev, errors } = setup(t);
  ev("ACT.buildPop({city:'mel'});ACT.buyIx({city:'syd',tier:0});ACT.buyIx({city:'mel',tier:0});ACT.buyIx({city:'syd~2',tier:0});ACT.rs({city:'mel'});compute()");
  const expected = JSON.parse(ev("JSON.stringify(utilityPeers().flatMap(r=>r.requests.map(id=>id+'@'+r.ix)))"));
  assert.ok(expected.length > 0);
  assert.ok(expected.some(k => k.endsWith('@syd~2')));
  const blocked = JSON.parse(ev("JSON.stringify(utilityPeers().flatMap(r=>r.blocked.map(b=>b.id+'@'+r.ix)))"));
  assert.ok(blocked.length > 0);
  const cash = ev('S.cash'), ports = ev('JSON.stringify(S.ixp)'), pnis = ev('JSON.stringify(S.pni)');
  ev('ACT.utilityPeers()');
  for (const k of expected) assert.equal(ev(`S.peers[${JSON.stringify(k)}]`), true, k);
  for (const k of blocked) assert.equal(ev(`!!S.peers[${JSON.stringify(k)}]`), false, k);
  assert.equal(ev('S.cash'), cash);
  assert.equal(ev('JSON.stringify(S.ixp)'), ports);
  assert.equal(ev('JSON.stringify(S.pni)'), pnis);
  const peers = ev('JSON.stringify(S.peers)');
  ev('ACT.utilityPeers()');
  assert.equal(ev('JSON.stringify(S.peers)'), peers);
  assert.equal(ev('utilityPeers().reduce((n,r)=>n+r.requests.length,0)'), 0);
  assert.deepEqual(errors, []);
});

test('bulk peering skips disconnected IXs, route server coverage and existing down sessions', t => {
  const { ev, errors } = setup(t);
  assert.equal(ev('utilityPeers().length'), 0);
  ev("ACT.utilityPeers();ACT.buyIx({city:'syd',tier:0});ACT.rs({city:'syd'});S.peers['ggl@syd']=true;compute()");
  assert.equal(ev("utilityPeers()[0].requests.includes('drz')"), false);
  assert.equal(ev("utilityPeers()[0].requests.includes('ggl')"), false);
  ev("ACT.cancelIx({city:'syd',sure:1,ok:1});ACT.utilityPeers()");
  assert.equal(ev('utilityPeers().length'), 0);
  assert.deepEqual(errors, []);
});

test('utilities are available from the Ops sheet in the menu and from PoP Infra in every language', t => {
  for (const lang of ['en', 'it', 'pt', 'fr', 'es']) {
    const { ev, dom, errors } = setup(t, lang === 'en' ? {} : { lang });
    ev('ACT.menu()');
    dom.window.document.querySelector('#modalCard [data-act="opsOpen"]').click();
    assert.ok(dom.window.document.querySelector('#modalCard [data-act="utilities"]'), lang);
    ev("selectCity('syd');ACT.tab({t:'links'})");
    assert.ok(dom.window.document.querySelector('#panelBody [data-act="utilityKit"]'), lang);
    ev('ACT.utilities()');
    assert.equal(dom.window.document.querySelector('#utilityCity').value, 'syd');
    assert.ok(!dom.window.document.querySelector('#modalCard').textContent.includes('utilities.'), lang);
    assert.deepEqual(errors, [], lang);
  }
});

test('join all route servers preserves existing sessions and covers rival and remote IX ports', t => {
  const { ev, errors } = setup(t);
  ev("ACT.buyIx({city:'syd',tier:0});ACT.rs({city:'syd'});window.fabric=FABS.find(f=>f.cities.includes('syd')&&f.cities.includes('sin')).id;S.links.push({id:'remote',a:'syd',b:'sin',kind:'vxc',prov:fabric,vt:1,km:kmBetween('syd','sin'),sub:false,mo:0,cut:0,day:S.day});ACT.buyIx({city:'sin',tier:0});ACT.buyIx({city:'sin~2',tier:0});compute()");
  assert.equal(ev("isRemote('sin')"), true);
  assert.deepEqual(JSON.parse(ev('JSON.stringify(utilityRouteServers().sort())')), ['sin', 'sin~2']);
  const cash = ev('S.cash'), ports = ev('JSON.stringify(S.ixp)'), peers = ev('JSON.stringify(S.peers)');
  ev('ACT.utilityRouteServers()');
  assert.equal(ev("S.rs.syd && S.rs.sin && S.rs['sin~2']"), true);
  assert.equal(ev("ixSessions('sin').has('drz')"), true);
  assert.equal(ev('S.cash'), cash);
  assert.equal(ev('JSON.stringify(S.ixp)'), ports);
  assert.equal(ev('JSON.stringify(S.peers)'), peers);
  const rs = ev('JSON.stringify(S.rs)');
  ev('ACT.utilityRouteServers()');
  assert.equal(ev('JSON.stringify(S.rs)'), rs, 'repeat never toggles a session off');
  assert.equal(ev('utilityRouteServers().length'), 0);
  assert.deepEqual(errors, []);
});

test('route-server batch leaves peering policy and player-owned exchanges alone', t => {
  const { ev, errors } = setup(t);
  ev('ACT.utilityRouteServers()');
  assert.equal(ev('Object.keys(S.rs).length'), 0, 'does not join an IX without a port');
  ev("ACT.buyIx({city:'syd',tier:0});ACT.peerPol({p:'closed'});ACT.utilityRouteServers()");
  assert.equal(ev('ppol()'), 'closed');
  assert.equal(ev('S.rs.syd'), true);
  assert.equal(ev("ixSessions('syd').has('drz')"), false, 'does not bypass closed policy');
  assert.match(ev("document.getElementById('modalCard').textContent"), /Off while your peering policy/);
  ev("S.myIx.syd={members:[],fab:0};S.rs.syd=false;ACT.utilityRouteServers()");
  assert.equal(ev('S.rs.syd'), false, 'owned exchange has no join-route-server control');
  assert.deepEqual(errors, []);
});

test('#192 the Infra tab shows the kit as one line, without repeating its rows', t => {
  for (const w of [1280, 360]) {
    const { ev, dom, errors } = setup(t);
    ev(`window.innerWidth=${w}`);
    ev("S.caches=[{id:'c1',city:'syd',net:'cfl'},{id:'c2',city:'syd',net:'cfl'}];compute();selectCity('syd');ACT.tab({t:'links'})");
    const body = dom.window.document.getElementById('panelBody');
    const txt = body.textContent;
    assert.match(txt, /PoP redundancy kit · One-off: /);
    assert.doesNotMatch(txt, /Second site(None|Installed)/, 'no second copy of the second-site row');
    assert.doesNotMatch(txt, /At least two routers/, 'no second copy of the routers row');
    assert.doesNotMatch(txt, /Request missing caches/, 'caches are in the Peering tab and Utilities');
    assert.equal(body.querySelectorAll('section h3').length, [...body.querySelectorAll('section h3')].filter(h => h.textContent !== 'PoP redundancy kit').length);
    assert.equal(txt.split('Backup generator').length - 1, 1, 'the generator shows once, in Power');
    assert.ok(body.querySelector('[data-act="utilityKit"]'), 'the kit is one tap away');
    body.querySelector('[data-act="utilities"]').click();
    assert.match(dom.window.document.getElementById('modalCard').textContent, /At least two routers/, 'the full kit is in Utilities');
    assert.equal(dom.window.document.querySelector('#utilityCity').value, 'syd');
    assert.deepEqual(errors, [], `${w}px`);
  }
});
