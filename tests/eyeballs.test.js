// More American eyeballs and a merger or two (#155), more Australian eyeballs (#154).
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./harness');

function start(ev) { ev("ACT.start({});S.cash=1e9;S.lvl=6;for(const g of GOALS)S.done[g.id]=0;ACT.launchBB({city:'syd'})"); }

test('Coax gets Spectre-um’d a year in, and Final Frontear joins Very-Zone a year later (#155)', () => {
  const { ev, errors } = load();
  start(ev);
  ev("ACT.buildPop({city:'sin'});ACT.buildPop({city:'bne'});ACT.buyIx({city:'bne',tier:1})");
  ev("S.pni.push({id:'p1',net:'cxc',city:'sin',tier:1,ready:0},{id:'p2',net:'ftr',city:'bne',tier:1,ready:0});S.peers['ftr@bne']=true;compute()");
  assert.doesNotMatch(ev("peerOk('cxc','pni','sin').why||''"), /Spectre-um/, 'Coax still decides for itself');
  ev('S.day=364;dayTick()');
  assert.equal(ev("merged('cxc')"), true, 'the deal closed');
  assert.equal(ev("S.pni.find(p=>p.id==='p1').net"), 'spc', 'the Coax PNI now belongs to Spectre-um');
  assert.match(ev("peerOk('cxc','pni','sin').why"), /Spectre-um/);
  assert.equal(ev("merged('ftr')"), false);
  const before = ev("pniMo(S.pni.find(p=>p.id==='p2'),0)");
  ev('S.day=729;dayTick()');
  assert.equal(ev("merged('ftr')"), true);
  assert.equal(ev("S.pni.find(p=>p.id==='p2').net"), 'vzn');
  assert.equal(ev("S.peers['ftr@bne']"), undefined, 'the IX session ended');
  assert.ok(ev("pniMo(S.pni.find(p=>p.id==='p2'),0)") > before, 'your free peer just became a paid one');
  // a PNI with the new owner in the same city absorbs the old one instead of doubling up
  const { ev: ev2 } = load();
  start(ev2);
  ev2("ACT.buildPop({city:'sin'});S.pni.push({id:'a',net:'cxc',city:'sin',tier:1,ready:0},{id:'b',net:'spc',city:'sin',tier:1,ready:0});S.day=400;dayTick()");
  assert.equal(ev2("S.pni.filter(p=>p.city==='sin').map(p=>p.net).join()"), 'spc');
  // saves keep the record of who merged
  ev("const o=JSON.parse(JSON.stringify(S));S=migrate(o)");
  assert.equal(ev("merged('cxc')&&merged('ftr')"), true);
  ev("S.merged={cxc:'x',zzz:3};S=migrate(JSON.parse(JSON.stringify(S)))");
  assert.equal(ev('S.merged'), undefined, 'junk in a save is dropped');
  assert.deepEqual(errors, []);
});

test('Australian eyeballs: Neptoon on every exchange family, Lawn-tel in Hobart, Internope behind its parent (#154)', () => {
  const { ev, errors } = load();
  start(ev);
  const asn = { npt: 151660, lnt: 134697, pnt: 10214, mag: 58511, inp: 4739 };
  for (const [id, a] of Object.entries(asn)) assert.equal(ev(`NET.${id}.asn`), a, id);
  for (const c of ['syd', 'mel', 'bne', 'per', 'adl']) assert.ok(ev(`ixMembers('${c}').includes('npt')`), `Neptoon on the ${c} exchange`);
  assert.ok(ev("XIXM['syd~2'].members.includes('npt')&&XIXM['syd~2'].members.includes('mag')"), 'and on the Sydney challenger');
  assert.ok(ev("ixMembers('hba').includes('lnt')&&NET.lnt.pol==='selective'"));
  assert.ok(ev("NET.mag.price>0&&NET.mag.pops.includes('akl')&&NET.mag.pops.includes('sin')"), 'the magpie flies far');
  assert.ok(ev("NET.inp.pol==='restrictive'&&NET.inp.ix.length===0&&NET.inp.up[0]==='tpr'"));
  assert.ok(ev("NET.stb.pops.includes('lax')"), 'Musklink is where most of its users are');
  assert.deepEqual(errors, []);
});
