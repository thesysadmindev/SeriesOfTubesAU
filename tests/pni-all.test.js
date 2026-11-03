const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

function setup(ev, cities = []) {
  ev("ACT.start({});S.cash=1e8;for(const g of GOALS)S.done[g.id]=0");
  for (const city of cities) ev(`ACT.buildPop({city:'${city}'})`);
  ev('for(const p of Object.values(S.pops))p.rgen=RG_TOP;compute()');
}

test('bulk PNIs add missing shared POPs and upgrade smaller ports once, preserving existing orders and LAGs', () => {
  const { dom, ev, errors } = load();
  setup(ev, ['mel', 'bne', 'per', 'sin', 'hkg', 'hba']);
  ev(`S.pni.push(
    {id:'small',net:'drz',city:'syd',tier:0,n:2,site:'ab',pref:'high'},
    {id:'big',net:'drz',city:'mel',tier:2},
    {id:'equal',net:'drz',city:'bne',tier:1},
    {id:'pending',net:'drz',city:'per',tier:0,ready:S.day+20},
    {id:'augment',net:'drz',city:'sin',tier:0,up:{tier:1,n:1,ready:S.day+20}});compute()`);
  const before = ev('JSON.stringify(S)');
  assert.deepEqual(JSON.parse(ev("JSON.stringify((b=>({shared:b.shared.length,orders:b.orders.length,kept:b.kept,cost:b.cost,mo:b.mo}))(pniBatch('drz',1)))")),
    { shared: 6, orders: 2, kept: 4, cost: 6750, mo: 650 });
  assert.equal(ev('JSON.stringify(S)'), before, 'preview does not change the save');
  const cash = ev('S.cash');
  const existing = JSON.parse(ev("JSON.stringify(S.pni.filter(p=>p.id!=='small'))"));
  ev("const originalAfter=after;window.after=()=>{window.afterCount=(window.afterCount||0)+1;originalAfter()};ACT.pniAll({net:'drz',tier:1})");
  assert.equal(ev('window.afterCount'), 1, 'one recompute/render/save for the whole batch');
  assert.equal(ev('S.cash'), cash - 6750);
  assert.equal(ev('S.pni.length'), 6);
  assert.equal(ev("S.pni.filter(p=>p.city==='hba').length"), 0, 'only shared owned POPs');
  assert.deepEqual(JSON.parse(ev("JSON.stringify(S.pni.filter(p=>['big','equal','pending','augment'].includes(p.id)))")), existing);
  assert.equal(ev("S.pni.find(p=>p.id==='small').up.n"), 2);
  assert.equal(ev("S.pni.find(p=>p.id==='small').site"), 'ab');
  assert.equal(ev("S.pni.find(p=>p.id==='small').pref"), 'high');
  assert.ok(ev("S.pni.find(p=>p.city==='hkg').ready>S.day"), 'new PNIs still take time');
  ev("ACT.pniAll({net:'drz',tier:1})");
  assert.equal(ev('S.cash'), cash - 6750, 'repeat clicks neither charge nor duplicate');
  assert.equal(ev('window.afterCount'), 1);
  ev('S=migrate(JSON.parse(JSON.stringify(packSave(S))));S.day=Math.max(...S.pni.map(p=>p.up?p.up.ready:p.ready||0));pniDay(S.day);compute()');
  assert.equal(ev("S.pni.find(p=>p.id==='small').tier"), 1, 'augment survives save migration and delivers');
  assert.equal(ev("S.pni.find(p=>p.city==='hkg').tier"), 1);
  assert.deepEqual(errors, []);
  dom.window.close();
});

test('bulk PNIs skip router speed and port capacity with city-specific reasons', () => {
  const { dom, ev, errors } = load();
  setup(ev, ['mel', 'sin']);
  ev(`S.pops.syd.rgen=0;S.pops.mel.rgen=1;
    S.caches=Array.from({length:portsMax('mel')},()=>({id:uid(),city:'mel',net:'cfl'}));
    while(['mel','sin'].some(c=>snub('msf',c)?.all))S.asn++;
    compute();R.demTo.msf=1e4;ACT.pniAllOpen({net:'msf'});ACT.pniAllSize({v:'2'})`);
  assert.equal(ev("pniBatch('msf',2).orders.length"), 1);
  assert.equal(ev("pniBatch('msf',2).blocked.length"), 2);
  const text = dom.window.document.getElementById('modalCard').textContent;
  assert.match(text, /Sydney.*router can't take a 400G/s);
  assert.match(text, /Melbourne.*No free router ports/s);
  const cash = ev('S.cash');
  ev("ACT.pniAll({net:'msf',tier:2})");
  assert.equal(ev('S.pni.length'), 1);
  assert.equal(ev('S.pni[0].city'), 'sin');
  assert.equal(ev('S.cash'), cash - 3500);
  assert.match(ev("S.log[0].t"), /blocked: 2/);
  assert.deepEqual(errors, []);
  dom.window.close();
});

test('insufficient funds refuse the entire eligible batch and execution rechecks a stale preview', () => {
  const { dom, ev, errors } = load();
  setup(ev, ['mel']);
  ev("S.cash=pniBatch('drz',1).cost-1;ACT.pniAllOpen({net:'drz'})");
  assert.equal(dom.window.document.querySelector('#modalCard [data-act="pniAll"]').disabled, true);
  const cash = ev('S.cash');
  ev("ACT.pniAll({net:'drz',tier:1})");
  assert.equal(ev('S.cash'), cash);
  assert.equal(ev('S.pni.length'), 0);
  ev("S.cash=1e8;ACT.pniAllOpen({net:'drz'});delete S.pops.mel;S.pops.syd.rgen=0;ACT.pniAll({net:'drz',tier:2})");
  assert.equal(ev('S.cash'), 1e8);
  assert.equal(ev('S.pni.length'), 0, 'deleted POPs and unsupported speeds are rechecked on click');
  assert.deepEqual(errors, []);
  dom.window.close();
});

test('bulk PNI actions reject invalid networks, sizes, minimum ports, traffic thresholds and non-shared locations', () => {
  const { dom, ev, errors } = load();
  setup(ev);
  ev('S.pops.syd.rgen=0');
  const cash = ev('S.cash');
  for (const net of ['missing', '__proto__', 'drz', 'nfx']) {
    for (const tier of [-2, -1, 0.5, 99, NaN, Infinity]) ev(`ACT.pniAll({net:'${net}',tier:${tier}})`);
  }
  ev("ACT.pniAll({net:'nfx',tier:0});R.demTo.nfx=0;ACT.pniAll({net:'nfx',tier:1})");
  assert.equal(ev('S.pni.length'), 0);
  assert.equal(ev('S.cash'), cash);
  ev("delete S.pops.syd;ACT.pniAllOpen({net:'drz'});ACT.pniAll({net:'drz',tier:1})");
  assert.match(dom.window.document.getElementById('modalCard').textContent, /no POPs in common/);
  assert.equal(dom.window.document.querySelector('#modalCard [data-act="pniAll"]').disabled, true);
  assert.deepEqual(errors, []);
  dom.window.close();
});

test('Telstraya 1G bulk orders and 10G augments keep paid-peering fees and conference delivery rules', () => {
  const { dom, ev, errors } = load();
  setup(ev, ['mel']);
  ev("S.conf={until:S.day+10,reg:'nsw'};Math.random=()=>0.5");
  const cash = ev('S.cash');
  assert.equal(ev("pniBatch('tsy',-1).cost"), 2400);
  assert.equal(ev("pniBatch('tsy',-1).mo"), ev('2*(PORT[0].pni/2+NET.tsy.paidFee)'));
  ev("ACT.pniAll({net:'tsy',tier:-1})");
  assert.equal(ev('S.cash'), cash - 2400);
  assert.equal(ev('S.stats.beerPni'), 1);
  assert.equal(ev('S.pni.every(p=>p.g1&&pniG(p)===1&&p.ready===S.day+14)'), true);
  ev('S.day+=15;pniDay(S.day);compute()');
  assert.equal(ev("pniBatch('tsy',0).mo"), 200, 'upgrades add port costs, without charging the peering fee twice');
  ev("ACT.pniAll({net:'tsy',tier:0});S.day=Math.max(...S.pni.map(p=>p.up.ready));pniDay(S.day)");
  assert.equal(ev('S.pni.every(p=>!p.g1&&pniG(p)===10)'), true);
  assert.deepEqual(errors, []);
  dom.window.close();
});

test('Traffic row buttons and size selection work by DOM events on phones in every language', () => {
  for (const lang of ['en', 'it', 'pt', 'fr', 'es']) {
    const { dom, ev, errors } = load(lang === 'en' ? {} : { lang });
    setup(ev);
    dom.window.innerWidth = 360;
    ev("ACT.launchBB({city:'syd'});ACT.dash();ACT.dashTab({k:'traffic'})");
    const doc = dom.window.document;
    const buttons = [...doc.querySelectorAll('#dashCard [data-act="pniAllOpen"]')];
    assert.ok(buttons.length > 0, lang);
    assert.equal(buttons.some(b => JSON.parse(b.dataset.args).net === '_tail'), false);
    const cash = ev('S.cash');
    buttons.find(b => JSON.parse(b.dataset.args).net === 'cfl').click();
    assert.equal(doc.getElementById('modal').hidden, false, lang);
    let select = doc.querySelector('#modalCard select');
    assert.equal(select.closest('label').textContent.includes(ev("tr('pni_all.pni_size')")), true, lang);
    select.focus();
    select.value = '0';
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    select = doc.querySelector('#modalCard select');
    assert.equal(select.value, '0', lang);
    assert.equal(doc.activeElement, select, 'size changes preserve keyboard focus');
    const submit = doc.querySelector('#modalCard [data-act="pniAll"]');
    assert.equal(JSON.parse(submit.dataset.args).tier, 0, lang);
    assert.equal(submit.disabled, false, lang);
    assert.equal(ev('S.cash'), cash, 'opening or changing the preview spends nothing');
    submit.click();
    assert.equal(doc.getElementById('modal').hidden, true, lang);
    assert.equal(ev("S.pni.some(p=>p.net==='cfl'&&p.city==='syd'&&p.tier===0)"), true, lang);
    assert.equal(ev('S.cash'), cash - 1750, lang);
    assert.doesNotMatch(doc.getElementById('modalCard').textContent, /pni_all\./, lang);
    assert.deepEqual(errors, [], lang);
    dom.window.close();
  }
});
