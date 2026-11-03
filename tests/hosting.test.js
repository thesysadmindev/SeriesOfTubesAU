// Hosting: rack space in a leased cage or a hall of your own, colocation and dedicated-server customers who rent it,
// and the rent on the bill.
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

function start(ev) {
  ev("UI.pitched=true;UI.nm='Rack Attack';if($('nmIn'))$('nmIn').value=UI.nm;ACT.pickStart({city:'syd'});ACT.start({});S.cash=5e6");
  ev("ACT.buyTransit({city:'syd',net:'tsy',tier:1});ACT.launchBB({city:'syd'})");
}
const panel = (ev, c) => ev(`selectCity('${c}');document.getElementById('panelBody').textContent`);
const offer = (ev, type, racks, bw = 5) => ev(`(()=>{const o={id:uid(),city:'syd',city2:null,name:'Test Co',type:'${type}',bw:${bw},racks:${racks},rate:100,reqs:[],latMax:null,exp:S.day+40};S.offers.push(o);return o.id;})()`);

test('rack space: a cage leased in someone else\'s building, or a hall of your own in a big city', () => {
  const { ev, errors } = load();
  start(ev);
  let p = panel(ev, 'syd');
  assert.match(p, /Data centre/);
  assert.match(p, /Lease a cage · 10 racks/);
  assert.match(p, /Build a data hall · 80 racks/);
  // Darwin is too small for a hall; a POI is the wholesaler's building, not a data centre.
  ev("ACT.buildPop({city:'drw'});ACT.buildPop({city:'2cmp'})");
  assert.equal(ev("dcCan('drw',0)&&!dcCan('drw',1)"), true);
  assert.doesNotMatch(panel(ev, '2cmp'), /Data centre/);
  assert.equal(ev("dcCan('2cmp',0)"), false);
  const cash = ev('S.cash');
  panel(ev, 'syd');
  ev("document.querySelector('#panelBody [data-act=dcLease]').click()");
  assert.equal(ev('S.cash'), cash - ev('DC_T[0].setup'));
  assert.deepEqual(JSON.parse(ev('JSON.stringify(S.dc.syd)')), [{ t: 0, ready: ev('S.day') + 14 }]);
  assert.equal(ev('R.cost.dc'), ev('DC_T[0].mo'), 'rent from the day it is signed');
  assert.equal(ev("dcCap('syd')"), 0, 'no racks until it is fitted out');
  assert.match(panel(ev, 'syd'), /Cage being fitted out: ready in 14 days/);
  for (let i = 0; i < 14; i++) ev('dayTick()');
  assert.equal(ev("dcCap('syd')"), 10);
  ev("ACT.dcLease({city:'syd',t:1})");
  assert.equal(ev("S.dc.syd.length"), 2);
  assert.equal(ev("dcCap('syd')"), 10, 'the hall takes months');
  for (let i = 0; i < 120; i++) ev('dayTick()');
  assert.equal(ev("dcCap('syd')"), 90);
  assert.deepEqual(errors, []);
});

test('colocation and dedicated servers rent racks: offers fit the room, signing takes it, rent is revenue', () => {
  const { ev, errors } = load();
  start(ev);
  ev("ACT.dcLease({city:'syd',t:0})");
  for (let i = 0; i < 14; i++) ev('dayTick()');
  // Offers only where there is room, never bigger than it.
  ev('S.offers=[];S.lvl=2');
  for (let i = 0; i < 200; i++) ev("spawnHosting(Math.random()<0.5?'colo':'dedi',['syd'])");
  const offs = JSON.parse(ev("JSON.stringify(S.offers.filter(o=>BIZ_T[o.type].racks))"));
  assert.ok(offs.length > 50 && offs.some((o) => o.type === 'dedi') && offs.some((o) => o.type === 'colo'));
  assert.ok(offs.every((o) => o.racks <= 10 && o.city === 'syd'), 'sized to the space');
  ev('S.offers=[]');
  // Colocation: the racks are taken and the rent is on the books.
  const id = offer(ev, 'colo', 4);
  ev(`ACT.accept({id:'${id}'})`);
  assert.equal(ev("dcUse('syd')"), 4);
  assert.equal(ev('R.rev.hosting'), 4 * ev('BIZ_T.colo.rk'));
  assert.ok(ev('R.revMo') >= ev('R.rev.hosting') + ev('R.rev.business'));
  assert.match(panel(ev, 'syd'), /Racks rented4 of 10/);
  assert.match(panel(ev, 'syd'), /4 racks · 5\.0 Gbps/);
  // Dedicated servers: the servers are bought on signing.
  const cash = ev('S.cash'), d = offer(ev, 'dedi', 2);
  ev(`ACT.accept({id:'${d}'})`);
  assert.equal(ev('S.cash'), cash - 2 * ev('SRV_COST'));
  assert.equal(ev('R.rev.hosting'), 4 * ev('BIZ_T.colo.rk') + 2 * ev('BIZ_T.dedi.rk'));
  // Too big for what is left: refused, nothing charged.
  const big = offer(ev, 'colo', 8), c2 = ev('S.cash');
  ev(`ACT.accept({id:'${big}'})`);
  assert.equal(ev(`S.offers.some(o=>o.id==='${big}')`), true, 'still on offer');
  assert.equal(ev('S.cash'), c2);
  assert.match(ev("document.getElementById('toasts').textContent"), /No free racks there/);
  // Space with tenants cannot be handed back.
  ev("ACT.dcDrop({city:'syd'})");
  assert.ok(ev('!!S.dc.syd'));
  assert.deepEqual(errors, []);
});

test('saves: data centre space and racks are checked on load, and go with their POP', () => {
  const { ev, errors } = load();
  start(ev);
  ev("ACT.dcLease({city:'syd',t:0});ACT.buildPop({city:'2cmp'})");
  ev("S.dc['2cmp']=[{t:0,ready:0}];S.dc.mel=[{t:0,ready:0}];S.dc.syd.push({t:9,ready:'x'},null);S.dc.nope=[]");
  ev("S.biz.push({id:'b1',city:'syd',type:'colo',name:'X',bw:2,rate:1,racks:999,mood:100,since:0,reqs:[]},{id:'b2',city:'syd',type:'dia',name:'Y',bw:2,rate:1,racks:5,mood:100,since:0,reqs:[]})");
  ev('S=migrate(JSON.parse(JSON.stringify(S)));compute()');
  assert.deepEqual(Object.keys(JSON.parse(ev('JSON.stringify(S.dc)'))), ['syd'], 'only an Australian POP off the POIs');
  assert.deepEqual(JSON.parse(ev('JSON.stringify(S.dc.syd.map(u=>u.t))')), [0, 1]);
  assert.equal(ev("S.biz.find(b=>b.id==='b1').racks"), 64, 'racks are clamped');
  assert.equal(ev("S.biz.find(b=>b.id==='b2').racks"), undefined, 'and only hosting customers have them');
  ev("delete S.dc;S=migrate(JSON.parse(JSON.stringify(S)))");
  assert.equal(ev('JSON.stringify(S.dc)'), '{}', 'older saves have none');
  ev("ACT.buildPop({city:'mel'});ACT.dcLease({city:'mel',t:0});decommission(['mel'])");
  assert.equal(ev('S.dc.mel'), undefined, 'decommissioned with its POP');
  assert.deepEqual(errors, []);
});

test('the data centre card fits a 360 px phone, in every language', () => {
  for (const lang of [undefined, 'de', 'es', 'fr', 'it', 'pt']) {
    const { ev, errors } = load(lang ? { lang } : {});
    ev("innerWidth=360;innerHeight=740;dispatchEvent(new Event('resize'))");
    start(ev);
    ev("ACT.dcLease({city:'syd',t:0})");
    for (let i = 0; i < 14; i++) ev('dayTick()');
    ev(`ACT.accept({id:'${offer(ev, 'colo', 2)}'})`);
    const p = panel(ev, 'syd');
    assert.doesNotMatch(p, /hosting\.|\{\w+\}|undefined|NaN/, `${lang || 'en'}: no raw labels`);
    assert.ok(ev("[...document.querySelectorAll('#panelBody .dcard button')].every(b=>b.classList.contains('b'))"));
    assert.deepEqual(errors, [], lang);
  }
});
