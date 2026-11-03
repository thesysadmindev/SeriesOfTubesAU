// NBN Points of Interconnect: a POP at a POI sells broadband only through an NNI port rented there, the port caps
// what the area's homes can pull, and every home is an AVC on the bill.
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

// Sydney with transit, and a wave out to the Campbelltown POI (120,908 premises: more than a 10G NNI carries).
function start(ev) {
  ev("UI.pitched=true;UI.nm='Bush Telegraph';if($('nmIn'))$('nmIn').value=UI.nm;ACT.pickStart({city:'syd'});ACT.start({});S.cash=5e6");
  ev("ACT.buyTransit({city:'syd',net:'tsy',tier:1})");
  ev("ACT.buildPop({city:'2cmp'});UI.via=null;openLinkModal('syd','2cmp');ACT.buildLink({tier:1});closeModal()");
  for (let i = 0; i < 20; i++) ev('dayTick()');
}
const panel = (ev) => ev("selectCity('2cmp');document.getElementById('panelBody').textContent");

test('a POI POP is half the price of a data center one, and sells nothing without an NNI', () => {
  const { ev, errors } = load();
  assert.equal(ev("popCost('2cmp')"), ev("Math.round(POP_COST*colo('2cmp')*POI_POP_F)"));
  assert.equal(ev("popCost('syd')"), ev("Math.round(POP_COST*colo('syd'))"), 'a hub is a normal POP');
  start(ev);
  assert.ok(ev("!!S.pops['2cmp']"));
  const p = panel(ev);
  assert.match(p, /Nearly Broadband Network POI/);
  assert.match(p, /Premises in the area120,908/);
  assert.match(p, /10G NNI ·.*100G NNI ·/);
  assert.equal(ev("document.querySelector('#panelBody [data-act=launchBB]').disabled"), true, 'no broadband button without an NNI');
  const cash = ev('S.cash');
  ev("ACT.launchBB({city:'2cmp'})");
  assert.equal(ev("S.pops['2cmp'].bb"), null, 'refused');
  assert.equal(ev('S.cash'), cash, 'and nothing charged');
  assert.match(ev("document.getElementById('toasts').textContent"), /Order an NNI port at this POI first/);
  // A hub needs none: its homes hand over in your own data center.
  ev("ACT.launchBB({city:'syd'})");
  assert.ok(ev('!!S.pops.syd.bb'));
  assert.deepEqual(errors, []);
});

test('the NNI is patched in after its lead time, then caps what the homes can pull; an upgrade lifts the cap', () => {
  const { ev, errors } = load();
  start(ev);
  const cash = ev('S.cash');
  ev("document.querySelector('#panelBody [data-act=nniOrder]').click()");
  assert.equal(ev('S.cash'), cash - ev('NNI_T[0].setup'));
  assert.deepEqual(JSON.parse(ev("JSON.stringify(S.poi['2cmp'])")), { t: 0, ready: ev('S.day') + 10 });
  assert.equal(ev('R.cost.nbn'), ev('NNI_T[0].mo'), 'the port is billed from the order');
  ev("ACT.launchBB({city:'2cmp'})");
  assert.ok(ev("!!S.pops['2cmp'].bb"), 'broadband can launch once the port is ordered');
  assert.equal(ev("R.cityEye['2cmp']"), 0, 'but no home connects before it is patched in');
  assert.match(panel(ev), /being patched in: ready in 10 days/);
  for (let i = 0; i < 10; i++) ev('dayTick()');
  assert.ok(ev("R.cityEye['2cmp']") > 0, 'live: homes connect');
  // Growth stops at the port: the area wants more than 10G.
  for (let i = 0; i < 400; i++) ev('dayTick()');
  assert.ok(ev("S.pops['2cmp'].bb.d") <= 10.5 + 1e-9, `wanted ${ev("S.pops['2cmp'].bb.d")}`);
  assert.ok(ev("R.cityEye['2cmp']") <= 10 + 1e-9);
  assert.ok(ev("eyeP('2cmp')") > 10, 'the area could pull more');
  let p = panel(ev);
  assert.match(p, /NNI port/);
  assert.match(p, /The NNI is full/);
  assert.match(p, /Services[\d,]+/);
  // Upgrade: the 10G port carries on until the 100G one is patched in.
  ev("document.querySelector('#panelBody [data-act=nniUp]').click()");
  assert.deepEqual(JSON.parse(ev("JSON.stringify(S.poi['2cmp'])")), { t: 1, ready: ev('S.day') + 21, was: 0 });
  assert.equal(ev("nniG('2cmp')"), 10, 'the old port until then');
  p = panel(ev);
  assert.match(p, /100G NNI port is being patched in/);
  assert.doesNotMatch(p, /The NNI is full/, 'no nudge to upgrade while the upgrade is on its way');
  for (let i = 0; i < 21; i++) ev('dayTick()');
  assert.equal(ev("nniG('2cmp')"), 100);
  for (let i = 0; i < 120; i++) ev('dayTick()');
  assert.ok(ev("R.cityEye['2cmp']") > 10.5, 'homes pull more through the bigger port');
  assert.equal(ev('R.cost.nbn'), ev('NNI_T[1].mo'));
  assert.deepEqual(errors, []);
});

test('every home is an AVC: the bill adds up to the wholesale share of what the homes pay', () => {
  const { ev, errors } = load();
  start(ev);
  ev("ACT.nniOrder({city:'2cmp',t:0});ACT.launchBB({city:'2cmp'});ACT.launchBB({city:'syd'})");
  for (let i = 0; i < 60; i++) ev('dayTick()');
  const want = ev("Object.keys(S.pops).reduce((a,c)=>a+R.cityEye[c]*sfOf(R,c)*(R.bbF[c]??1)*EYE_RATE*arpuOf(c)*AU_WHOLESALE,0)");
  assert.ok(want > 0);
  assert.ok(Math.abs(ev('R.cost.wholesale') - want) < 1e-6, 'AVCs on every Australian home');
  assert.equal(ev("nbnSubs(10)"), 3000, 'about 3.3 Mbps of busy hour per service');
  assert.match(panel(ev), /AVCs\$[\d.,]+k?\/mo/);
  assert.deepEqual(errors, []);
});

test('saves: NNI ports are checked on load, and go with their POP', () => {
  const { ev, errors } = load();
  start(ev);
  ev("ACT.nniOrder({city:'2cmp',t:1})");
  ev("S.poi.syd={t:0,ready:0};S.poi['2ash']={t:0,ready:0};S.poi.nope={t:0};S.poi['2cmp'].t=7;S.poi['2cmp'].was='x'");
  ev('S=migrate(JSON.parse(JSON.stringify(S)));compute()');
  assert.deepEqual(Object.keys(JSON.parse(ev('JSON.stringify(S.poi)'))), ['2cmp'], 'only a POI with a POP of yours');
  assert.equal(ev("S.poi['2cmp'].t"), 1, 'the size is clamped');
  ev("delete S.poi;S=migrate(JSON.parse(JSON.stringify(S)))");
  assert.equal(ev('JSON.stringify(S.poi)'), '{}', 'older saves get none');
  ev("ACT.nniOrder({city:'2cmp',t:0});decommission(['2cmp'])");
  assert.equal(ev("S.poi['2cmp']"), undefined, 'decommissioned with its POP');
  assert.deepEqual(errors, []);
});

test('the POI card fits a 360 px phone, in every language', () => {
  for (const lang of [undefined, 'de', 'es', 'fr', 'it', 'pt']) {
    const { ev, errors } = load(lang ? { lang } : {});
    ev("innerWidth=360;innerHeight=740;dispatchEvent(new Event('resize'))");
    start(ev);
    ev("ACT.nniOrder({city:'2cmp',t:0});ACT.launchBB({city:'2cmp'})");
    for (let i = 0; i < 30; i++) ev('dayTick()');
    const p = panel(ev);
    assert.doesNotMatch(p, /nbn\.|\{\w+\}|undefined|NaN/, `${lang || 'en'}: no raw labels`);
    assert.ok(ev("[...document.querySelectorAll('#panelBody .nbn button')].every(b=>b.classList.contains('b'))"), 'buttons the phone rules size');
    assert.deepEqual(errors, [], lang);
  }
});
