// Progression on the Australian map: states and territories instead of continents, the Big Four on the road to
// Tier 1, and badges for the places only Australia has.
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

const start = (ev) => ev("UI.pitched=true;UI.nm='Wombat Wireless';if($('nmIn'))$('nmIn').value=UI.nm;ACT.pickStart({city:'syd'});ACT.start({});S.cash=1e9");
const badge = (ev, id) => ev(`BADGES.find(b=>b.id==='${id}').ok()`);

test('states and territories count, the gateways overseas do not', () => {
  const { ev, errors } = load();
  start(ev);
  for (const c of ['mel', 'sin', 'akl', 'lax']) ev(`ACT.buildPop({city:'${c}'})`);
  assert.equal(ev('regionsCount()'), 2, 'NSW and Victoria');
  for (const c of ['bne', 'per', 'adl', 'hba', 'cbr', 'drw']) ev(`ACT.buildPop({city:'${c}'})`);
  assert.equal(ev('regionsCount()'), 8);
  assert.equal(badge(ev, 'six'), true, 'the whole map');
  assert.match(ev("GOALS.find(g=>g.id==='c3').d"), /3 states or territories/);
  assert.deepEqual(errors, []);
});

test('Tier 1 takes a PNI with every global Tier 1 and with the Big Four at home', () => {
  const { ev, errors } = load();
  start(ev);
  const need = JSON.parse(ev('JSON.stringify(t1Need().map(n=>n.id))'));
  for (const id of ['tsy', 'opt', 'tpr', 'voc']) assert.ok(need.includes(id), id);
  assert.ok(ev("t1Need().some(n=>n.type==='t1')"), 'and the global ones');
  ev("for(const n of t1Need())if(n.id!=='voc'){S.pops[n.pops[0]]=S.pops[n.pops[0]]||{day:0,bb:null,routers:1};S.pni.push({id:'t'+n.id,net:n.id,city:n.pops[0],tier:0});}compute();R.reach=1");
  assert.equal(ev('isTier1()'), false, 'Hocus Pocus is still missing');
  assert.match(ev('t1Why()'), /Hocus Pocus/);
  ev("S.pni.push({id:'tvoc',net:'voc',city:NET.voc.pops[0],tier:0});S.pops[NET.voc.pops[0]]=S.pops[NET.voc.pops[0]]||{day:0,bb:null,routers:1};compute();R.reach=1");
  assert.equal(ev('isTier1()'), true);
  assert.deepEqual(errors, []);
});

test('badges for Australian places: the Black Stump, the Nullarbor, Bass Strait, racks and every POI', () => {
  const { ev, errors } = load();
  start(ev);
  for (const id of ['stump', 'nullarbor', 'bass', 'racks', 'full']) assert.equal(badge(ev, id), false, `${id}: not on day one`);
  ev("ACT.buildPop({city:'asp'})");
  assert.equal(badge(ev, 'stump'), true);
  ev("S.links.push({id:'nl',a:'adl',b:'per',kind:'wave',tier:1,km:2131,mo:1,cut:0})");
  assert.equal(badge(ev, 'nullarbor'), true, 'Adelaide to Perth crosses it');
  ev("S.links.push({id:'b1',a:'mel',b:'hba',kind:'wave',tier:1,km:602,mo:1,cut:0,cable:'bassline'})");
  assert.equal(badge(ev, 'bass'), false, 'one cable is not both');
  ev("S.links.push({id:'b2',a:'mel',b:'hba',kind:'wave',tier:1,km:906,mo:1,cut:0,cable:'ferry'})");
  assert.equal(badge(ev, 'bass'), true);
  ev("S.biz.push({id:'r1',city:'syd',type:'colo',name:'X',bw:1,rate:1,racks:64,mood:100,since:0,reqs:[]},{id:'r2',city:'syd',type:'dedi',name:'Y',bw:1,rate:1,racks:36,mood:100,since:0,reqs:[]})");
  assert.equal(badge(ev, 'racks'), true);
  ev("for(const p of POIS){S.pops[p.id]={day:0,bb:null,routers:1};S.poi[p.id]={t:0,ready:0};}");
  assert.equal(badge(ev, 'full'), true);
  ev("delete S.poi['2cmp']");
  assert.equal(badge(ev, 'full'), false, 'every one of them');
  assert.deepEqual(errors, []);
});
