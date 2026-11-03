// Saves from the old world map (ADR 0004): listed and exportable as they are, never loaded, gutted or written over.
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, browser } = require('./harness');

const settle = async (ev, cond, what) => { for (let i = 0; i < 400 && !ev(cond); i++) await new Promise((r) => setTimeout(r, 5)); assert.ok(ev(cond), what || cond); };
const card = (ev) => ev("document.getElementById('modalCard').textContent");
const idx = (ev) => JSON.parse(ev('JSON.stringify(slotIdx())'));
// A network as the world-map versions saved it: Frankfurt, no mapV.
const WORLD = JSON.stringify({ v: 1, name: 'Old World', asn: 201234, home: 'fra', day: 400, cash: 812345, rules: { preset: 'oncall' },
  pops: { fra: { day: 0, bb: { d: 10 }, boost: 0, down: 0, routers: 2, gen: false }, ams: { day: 3, bb: null, routers: 1 } },
  links: [{ id: 'l1', a: 'fra', b: 'ams', kind: 'wave', tier: 1, km: 360, mo: 9000 }], transit: [{ id: 't1', city: 'fra', net: 'cog', tier: 1 }],
  ixp: { fra: 1 }, biz: [], offers: [], inc: [], stats: {}, sv: { seq: 7, at: 1700000000000 } });

test('the old single save from the world map is listed as retired, and never loaded or rewritten', async () => {
  const b = browser();
  const a = load({ browser: b, storage: { 'sot-save-v1': WORLD } });
  await settle(a.ev, "!!document.getElementById('slotList')", 'the title screen lists it');
  assert.equal(a.ev('!UI.started'), true, 'not continued');
  assert.equal(a.ev('!S'), true, 'not loaded either');
  const e = idx(a.ev);
  assert.equal(e.length, 1);
  assert.equal(e[0].retired, true);
  assert.equal(e[0].name, 'Old World');
  const row = a.ev("document.getElementById('slotList').textContent");
  assert.match(row, /Old World/);
  assert.match(row, /World map, retired: export or delete/);
  assert.equal(a.ev("document.querySelector('#slotList .slot-go').dataset.act"), 'slotMenu', 'the row opens its menu, not the game');
  a.ev("document.querySelector('#slotList .slot-go').click()");
  assert.equal(a.ev("!!document.querySelector('#modalCard [data-act=cont]')"), false, 'no Continue in the menu');
  assert.ok(a.ev("!!document.querySelector('#modalCard [data-act=slotExport]')"));
  // Continue by id (an old link, the other window): the notice, still not loaded.
  a.ev("ACT.cont({id:'main'})");
  await settle(a.ev, "/The map changed/.test(document.getElementById('modalCard').textContent)", 'the map-changed notice');
  assert.match(card(a.ev), /Old World is from the world map/);
  assert.equal(a.ev('!UI.started'), true);
  // Export: the file wraps the saved text exactly as it is.
  a.ev('window.__dl=null;saveDl=(t)=>{window.__dl=t;}');
  a.ev("document.querySelector('#modalCard [data-act=slotExport]').click()");
  await settle(a.ev, '!!window.__dl', 'a file');
  assert.equal(JSON.stringify(JSON.parse(a.ev('__dl')).S), WORLD, 'byte for byte');
  // A new network plays and saves next to it; the old save is untouched.
  a.ev("closeModal();UI.pitched=true;UI.nm='New Hope';if($('nmIn'))$('nmIn').value=UI.nm;ACT.pickStart({city:'syd'});ACT.start({});for(let i=0;i<3;i++)dayTick();save(true)");
  await settle(a.ev, 'UI.started===true');
  assert.equal(a.ev('S.mapV'), 2, 'a new game is on the Australian map');
  assert.equal(b.ls.get('sot-save-v1'), WORLD, 'the old key is never written');
  assert.ok(idx(a.ev).some((x) => x.id === 'main' && x.retired), 'and stays listed');
  assert.deepEqual(a.errors, []);
});

test('a world-map slot an older index did not mark is caught when it opens: retired, kept, never saved over', async () => {
  const b = browser();
  const ix = JSON.stringify({ v: 1, slots: [{ id: 'abc', name: 'Old World', day: 400, cash: 812345, seq: 7, at: 1700000000000, size: WORLD.length }] });
  const a = load({ browser: b, storage: { 'sot-save-v1:abc': WORLD, 'sot-slots': ix } });
  await settle(a.ev, "/The map changed/.test(document.getElementById('modalCard').textContent)", 'the notice on boot');
  assert.equal(a.ev('!UI.started'), true);
  assert.equal(a.ev('UI.slot'), null, 'this window is not playing it');
  assert.equal(a.ev("SLOT.no.has('abc')"), true, 'nothing may write it');
  assert.equal(idx(a.ev)[0].retired, true, 'marked for the next visit');
  a.ev('save(true)');
  assert.equal(b.ls.get('sot-save-v1:abc'), WORLD);
  // Deleting it is still possible.
  a.ev("ACT.slotDelGo({id:'abc'})");
  assert.equal(b.ls.get('sot-save-v1:abc'), undefined);
  assert.deepEqual(idx(a.ev), []);
  assert.deepEqual(a.errors, []);
});

test('importing a world-map file is refused with a reason; an Australian save imports', () => {
  const { ev, errors } = load();
  assert.match(ev(`parseSave(${JSON.stringify(JSON.stringify({ app: 'series-of-tubes', version: '2.3.0', S: JSON.parse(WORLD) }))}).err`), /old world map/);
  ev("UI.pitched=true;$('nmIn').value='Down Under';ACT.pickStart({city:'mel'});ACT.start({});for(let i=0;i<3;i++)dayTick()");
  const r = JSON.parse(ev('JSON.stringify(parseSave(JSON.stringify({app:"series-of-tubes",S:packSave(S)})))'));
  assert.equal(r.err, undefined);
  assert.equal(r.s.mapV, 2);
  assert.equal(ev('worldSave(migrate(JSON.parse(JSON.stringify(S))))'), false, 'migrate keeps the map version');
  assert.deepEqual(errors, []);
});
