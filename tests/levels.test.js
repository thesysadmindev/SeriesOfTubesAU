const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

const fresh = ev => ev("ACT.start({});S.cash=1e9;for(const g of GOALS)S.done[g.id]=0;ACT.launchBB({city:'syd'})");
// Fake a network of n POPs spread over the given regions, without building anything.
// Fake a network of n POPs in the given states (POIs among them), without building anything: `poi` of the POIs get a
// live NNI, and a colocation customer rents `racks` racks.
const fake = (ev, n, regs, peak, poi = 0, racks = 0) => ev(`(()=>{const rs=${JSON.stringify(regs)},pick=[];for(const r of rs){const c=CITIES.find(x=>x.reg===r&&!pick.includes(x.id));pick.push(c.id);}for(const c of CITIES.filter(x=>x.poi).concat(CITIES)){if(pick.length>=${n})break;if(!pick.includes(c.id)&&rs.includes(c.reg))pick.push(c.id);}
  S.pops={};for(const c of pick)S.pops[c]={day:0,bb:null,boost:0,down:0,routers:1,gen:false,rgen:0};S.poi={};for(const c of pick.filter(isPoi).slice(0,${poi}))S.poi[c]={t:0,ready:0};
  S.biz=${racks}?[{id:'rk',city:pick[0],type:'colo',name:'Rack Co',bw:1,rate:1,racks:${racks},mood:100,since:0,reqs:[]}]:[];S.stats.peak=${peak};return custLevel();})()`);
const AU8 = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'];

test('thirteen customer levels, each harder than the last', () => {
  const { ev, errors } = load();
  fresh(ev);
  assert.equal(ev('LEVELS.length'), 13);
  assert.equal(ev('LV_REQ.length'), 13);
  assert.equal(ev('LEVELS.every(L=>L.n&&L.req&&L.unlock&&L.q)'), true, 'every level has a name, a goal, an unlock and a joke');
  assert.equal(ev('LV_REQ.slice(2).every((q,i)=>q.pk>LV_REQ[i+1].pk&&q.pops>LV_REQ[i+1].pops)'), true);
  assert.equal(fake(ev, 10, ['nsw', 'vic', 'qld'], 700, 6), 4, 'level 4: three states and six POIs live');
  assert.equal(fake(ev, 10, ['nsw', 'vic', 'qld'], 700, 5), 3, 'a POI short');
  assert.equal(fake(ev, 15, ['nsw', 'vic', 'qld'], 1200, 6, 10), 4, 'level 5 needs a fourth state');
  assert.equal(fake(ev, 15, ['nsw', 'vic', 'qld', 'wa'], 1200, 6, 9), 4, 'and ten racks rented');
  assert.equal(fake(ev, 15, ['nsw', 'vic', 'qld', 'wa'], 1200, 6, 10), 5);
  assert.equal(fake(ev, 132, AU8, 10000, 120, 200), 12, 'level 13 needs every POI');
  assert.equal(fake(ev, 132, AU8, 10000, 121, 200), 13);
  assert.equal(ev('LEVELS[4].req'), 'peak 1.20 Tbps · 15 POPs · 4 states or territories · 6 NBN POIs live · 10 racks rented', 'the goal reads from the table');
  ev("S.lvl=8;S.pops={syd:S.pops.syd||{day:0,routers:1,rgen:0}};renderAll()");
  assert.equal(ev("lvlItems().map(x=>x.l+':'+x.max).join()"), 'Peak traffic:4200,POPs:40,States and territories:8,NBN POIs with a live NNI:25,Racks rented:40');
  assert.deepEqual(errors, []);
});

test('traffic eras raise the eyeball ceiling as you level up', () => {
  const { ev, errors } = load();
  fresh(ev);
  const P = ev('CITY.syd.P');
  ev('S.lvl=4');
  assert.equal(ev("eyeP('syd')"), P);
  ev('S.lvl=5');
  assert.ok(Math.abs(ev("eyeP('syd')") - P * 1.15) < 1e-6, '4K everything');
  ev('S.lvl=13');
  assert.ok(Math.abs(ev("eyeP('syd')") / P - 1.15 * 1.15 * 1.2 * 1.25) < 1e-6);
  // with great service, Sydney's eyeballs now grow past the old ceiling
  ev("S.pops.syd.bb.d=CITY.syd.P*0.99;R.cityDem={syd:1};R.citySrv={syd:1};const t=compute;compute=()=>{};for(let i=0;i<60;i++){S.day++;dayTick();R.cityDem={syd:1};R.citySrv={syd:1};}compute=t");
  assert.ok(ev('S.pops.syd.bb.d') > P * 1.05, `grew to ${ev('S.pops.syd.bb.d')} of ${P}`);
  assert.deepEqual(errors, []);
});

test('new routers: the 3.2T main line, side-grades, and 3.2T ports only once unlocked', () => {
  const { ev, errors } = load();
  fresh(ev);
  ev('S.lvl=4');
  const up = ev("RG[mainRG(RG[3].cls+1)].n");
  assert.equal(up, 'Absolute Unit 3.2T', 'the 1.6T Absolute Unit upgrades to its big sibling');
  assert.equal(ev("mainRG(1)"), 1, 'old main line keeps its indexes');
  assert.equal(ev('portShown(5)'), false, 'no 3.2T port buttons at level 4');
  assert.equal(ev('waveShown(6)'), false);
  ev('S.lvl=7');
  assert.equal(ev('portShown(5)'), true);
  assert.equal(ev('waveShown(6)'), true);
  ev("S.pops.syd.rgen=3;S.pops.syd.routers=1;ACT.upRouter({city:'syd'})");
  assert.equal(ev("RG[S.pops.syd.rgen].n"), 'Absolute Unit 3.2T');
  ev("S.day++;const g=RG.findIndex(r=>r.lvl===13);ACT.upRouter({city:'syd',g})");
  assert.equal(ev("RG[S.pops.syd.rgen].n"), 'Absolute Unit 3.2T', 'the Router at the End of the Universe waits for level 13');
  ev("S.lvl=13;S.day++;ACT.upRouter({city:'syd',g:RG.findIndex(r=>r.lvl===13)})");
  assert.equal(ev("RG[S.pops.syd.rgen].ports"), 256);
  // every model's numbers make sense for its class
  assert.equal(ev("RG.every(r=>PORT[r.maxP]&&LT[r.maxLT]&&r.pn===PORT[r.maxP].n&&r.lvl>=1&&r.lvl<=LEVELS.length)"), true);
  assert.deepEqual(errors, []);
});

test('C+L line systems double the channels; level 12 trenches hold eight pairs', () => {
  const { ev, errors } = load();
  fresh(ev);
  ev("S.lvl=6;ACT.buildPop({city:'mel'});S.pops.syd.rgen=S.pops.mel.rgen=3;S.links.push({id:'own1',a:'syd',b:'mel',kind:'df',own:true,km:450,sys:'roadm',ch:[],ready:0,mo:500,day:0,cut:0,pairs:2});compute()");
  assert.equal(ev("chMax(S.links[0])"), 128);
  const c0 = ev('S.cash');
  ev("ACT.upSys({id:'own1'})");
  assert.equal(ev('S.links[0].sys'), 'cl');
  assert.equal(c0 - ev('S.cash'), 2 * ev('DF_SYS.cl.cost'), 'both lit pairs get the new gear');
  assert.equal(ev("chMax(S.links[0])"), 256);
  assert.equal(ev("pairsMax(S.links[0])"), 4);
  ev('S.lvl=12');
  assert.equal(ev("pairsMax(S.links[0])"), 8);
  ev("S.links[0].pairs=8;S=migrate(JSON.parse(JSON.stringify(S)))");
  assert.equal(ev('S.links[0].pairs'), 8, 'kept at level 12');
  ev("S.lvl=5;S=migrate(JSON.parse(JSON.stringify(S)))");
  assert.equal(ev('S.links[0].pairs'), 4, 'clamped below level 12');
  ev("S.links[0].sys='cl';S.links[0].ch=['tp32'];compute()");
  assert.match(ev("chWhy(S.links[0],'tp32')"), /level 8/);
  assert.deepEqual(errors, []);
});

test('paid-peering giants give you a free PNI once you are big enough', () => {
  const { ev, errors } = load();
  fresh(ev);
  ev("S.lvl=5;compute()");
  assert.equal(ev("peerOk('tsy','pni','syd').fee"), ev('NET.tsy.paidFee'));
  assert.match(ev("offTransitHint('tsy','syd')"), /Free from customer level 6/);
  const p = "({id:'p1',city:'syd',net:'tsy',tier:2,n:1})";
  assert.equal(ev(`pniMo(${p},0)`), ev('PORT[2].pni') + ev('NET.tsy.paidFee'));
  ev('S.lvl=6');
  assert.equal(ev("peerOk('tsy','pni','syd').free"), true);
  assert.match(ev("offTransitHint('tsy','syd')"), /too big to charge/);
  assert.equal(ev(`pniMo(${p},0)`), ev('PORT[2].pni'), 'only the port is left to pay');
  assert.equal(ev("peerOk('tsy','ix','syd').ok"), false, 'still no IX peering');
  assert.equal(ev("NETS.filter(n=>n.freeLv).every(n=>n.pol==='paid'&&!n.perG&&n.freeLv>4)"), true, 'Korean sender-pays stays');
  assert.deepEqual(errors, []);
});

test('the new customer types turn up at their levels', () => {
  const { ev, errors } = load();
  fresh(ev);
  ev("for(const c of ['mel','hba','adl','drw','bne'])ACT.buildPop({city:c});S.lvl=4;S.offers=[];for(let i=0;i<600;i++){spawnOffer();S.offers.length=0;}");
  const types = lv => ev(`(()=>{S.lvl=${lv};const seen=new Set();for(let i=0;i<1500;i++){S.offers=[];spawnOffer();for(const o of S.offers)seen.add(o.type);}return [...seen].sort().join();})()`);
  const at4 = types(4).split(',');
  for (const t of ['esport', 'sov', 'cgame', 'metav', 'agi', 'mars']) assert.ok(!at4.includes(t), `${t} not before its level`);
  const at13 = types(13).split(',');
  for (const t of ['esport', 'sov', 'cgame', 'metav', 'agi', 'mars']) assert.ok(at13.includes(t), `${t} shows up at level 13 (${at13})`);
  ev("S.offers=[];S.lvl=13;let o;for(let i=0;i<3000&&!o;i++){S.offers=[];spawnOffer();o=S.offers.find(x=>x.type==='agi');}window.__o=o");
  assert.ok(ev('__o.bw') >= 12800 && ev("__o.reqs.includes('diverse')"), 'AGI labs want huge diverse AI WANs');
  assert.deepEqual(errors, []);
});

test('old saves keep their level; nonsense levels are clamped', () => {
  const { ev, errors } = load();
  fresh(ev);
  ev("S.lvl=4;S=migrate(JSON.parse(JSON.stringify(S)))");
  assert.equal(ev('S.lvl'), 4);
  ev("S.lvl=99;S=migrate(JSON.parse(JSON.stringify(S)))");
  assert.equal(ev('S.lvl'), 13);
  ev("UI.left='goals';UI.leftOpen=true;renderAll()");
  assert.match(ev("document.getElementById('leftBody').textContent"), /Customer level 13 of 13/);
  assert.match(ev("document.getElementById('leftBody').textContent"), /You are the internet/);
  assert.deepEqual(errors, []);
});

test('a big old network that jumps several levels hears about each one in the event log', () => {
  const { ev, errors } = load();
  fresh(ev);
  fake(ev, 25, ['nsw', 'vic', 'qld', 'wa', 'sa'], 2500, 12, 40);
  ev("S.lvl=4;S.stats.peak=2500;document.getElementById('toasts').innerHTML='';dayTick()");
  assert.equal(ev('S.lvl'), 7);
  const t = ev("S.log.map(e=>e.t).join(' | ')");
  for (const n of ['Customer level 5', 'Customer level 6', 'Customer level 7']) assert.ok(t.includes(n), n);
  assert.deepEqual(errors, []);
});
