const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

function setup(ev) {
  ev("ACT.start({});S.cash=1e9;S.lvl=6;S.nextFail=S.nextEvent=1e9;for(const g of GOALS)S.done[g.id]=0;for(const c of ['sin','drw','mel','per'])ACT.buildPop({city:c});for(const c in S.pops)S.pops[c].rgen=3");
  ev("const L=(a,b,v)=>{UI.via=v||null;openLinkModal(a,b);ACT.buildLink({tier:1});closeModal();};L('drw','per');L('per','sin','indigo');L('per','syd');L('syd','mel')");
  ev("ACT.launchBB({city:'drw'});S.pops.drw.bb.d=100;ACT.launchBB({city:'mel'});S.pops.mel.bb.d=100");
}

test('broadband backhauled to transit far away is slow, and slow is bad service', () => {
  const { ev, errors } = load();
  setup(ev);
  ev("ACT.buyTransit({city:'syd',net:'cog',tier:2});compute()");
  // Darwin's only way out is transit in Sydney, by way of Perth and the Nullarbor: everything is delivered, and it is
  // all too slow (nobody sells transit in Singapore: you go there to peer)
  assert.ok(ev('R.citySrv.drw/R.cityDem.drw') > 0.95, 'delivered');
  assert.ok(ev('R.latFar.drw.ms') > 50, `${ev('R.latFar.drw.ms')} ms round trip`);
  assert.equal(ev('R.latFar.drw.to'), 'syd');
  assert.ok(ev("sfOf(R,'drw')") < 0.55, 'over 50 ms counts as bad service');
  // Melbourne goes out in Sydney, a few hundred kilometres away: fine
  assert.equal(ev('R.latF.mel'), undefined);
  assert.ok(ev("sfOf(R,'mel')") > 0.95);
  // the panel and the NOC say so
  ev("UI.sel={type:'city',id:'drw'};UI.tab='up';renderPanel()");
  assert.match(ev("document.getElementById('panelBody').textContent"), /backhauled to transit in Sydney/);
  ev("UI.sel=null;UI.left='noc';UI.leftOpen=true;renderLeft()");
  assert.match(ev("document.getElementById('left').textContent"), /Slow cities/);
  // bad service costs customers and money: broadband shrinks instead of growing
  const d0 = ev('S.pops.drw.bb.d'), a0 = ev('S.pops.mel.bb.d');
  for (let i = 0; i < 20; i++) ev('dayTick()');
  assert.ok(ev('S.pops.drw.bb.d') < d0, 'Darwin churns');
  assert.ok(ev('S.pops.mel.bb.d') >= a0, 'Melbourne does not');
  // local transit fixes it
  ev("ACT.buyTransit({city:'drw',net:'tsy',tier:1});compute()");
  assert.equal(ev('R.latF.drw'), undefined);
  assert.ok(ev("sfOf(R,'drw')") > 0.95);
  assert.deepEqual(errors, []);
});

test('the penalty is on a curve, and traffic that needs no transit is never penalised', () => {
  const { ev, errors } = load();
  assert.equal(ev('latLoss(15)'), 0);
  assert.equal(ev('latLoss(20)'), 0);
  assert.ok(Math.abs(ev('latLoss(35)') - 0.1) < 1e-9);
  assert.ok(Math.abs(ev('latLoss(50)') - 0.2) < 1e-9);
  assert.equal(ev('latLoss(51)'), 0.5);
  setup(ev);
  // Darwin reaches an open network over peering in Singapore: far, but no transit, so no penalty
  ev("const x=ixIdsIn('sin')[0];ACT.buyIx({city:x,tier:1});ACT.rs({city:x});compute()");
  assert.ok(ev("Object.keys(R.netEg).some(n=>R.netEg[n].ix>0)"), 'traffic over the IX');
  assert.equal(ev('R.latF.drw'), undefined);
  assert.equal(ev("sfOf(R,'drw')"), ev("clamp(R.citySrv.drw/R.cityDem.drw,0,1)"));
  assert.deepEqual(errors, []);
});

test('the slow-city warning box does not restyle the yellow progress bars', () => {
  const { ev, errors } = load();
  // .bar.warn is the yellow bar; the latency box once used a plain .warn class and padded every yellow bar
  const st = JSON.parse(ev(`(()=>{const b=document.createElement('div');b.className='bar warn';const w=document.createElement('div');w.className='latwarn';document.body.append(b,w);
    const a=getComputedStyle(b),c=getComputedStyle(w);return JSON.stringify({bar:a.paddingTop+a.paddingLeft,box:c.paddingTop});})()`));
  assert.ok(!st.bar || st.bar === '0px0px', `yellow bars have no padding (${st.bar})`);
  assert.equal(st.box, '8px', 'the warning box keeps its own');
  assert.deepEqual(errors, []);
});
