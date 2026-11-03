// Where a flood goes and who pays for it: junk enters at its ingress ports and rides your backbone to the victim.
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

// Sydney has the eyeballs and no transit; all transit is in Melbourne, 100G of wave away.
const remoteTransit = (ev, flip) => {
  ev("ACT.start({});S.cash=1e9;S.nextFail=1e9;S.nextEvent=1e9;ACT.buildPop({city:'mel'});ACT.launchBB({city:'syd'});S.links.push({id:'L',a:'syd',b:'mel',kind:'wave',tier:1,km:400,mo:1,cut:0});ACT.buyTransit({city:'mel',net:NETS.find(n=>sellsAt(n,'mel')).id,tier:1})");
  if (flip) ev("const p=S.pops;S.pops={mel:p.mel,syd:p.syd}");
  ev("compute()");
};

test('a flood loads the backbone and the victim as on main, whatever order the POPs were built in', () => {
  const out = [];
  for (const flip of [false, true]) {
    const { ev, errors } = load({ seed: 5 });
    remoteTransit(ev, flip);
    assert.ok(ev("sfOf(R,'syd')") > 0.95, 'fine before the attack');
    ev("S.day=60;ddosAttack();Object.assign(S.ev.ddos,{city:'syd',tgt:'bb:syd',vec:'http',gbps:300});compute()");
    assert.equal(ev('R.load.L'), 100, 'the junk fills the wave between the transit and the victim');
    assert.ok(ev('R.nodeLoad.syd') >= 100, "and the victim's router");
    assert.ok(ev("sfOf(R,'syd')") < 0.05, 'the victim goes dark');
    assert.equal(ev("sfOf(R,'mel')"), 1);
    out.push(ev("JSON.stringify([R.load.L,Object.values(R.useT)[0],sfOf(R,'syd'),R.ddos.length])"));
    assert.deepEqual(errors, []);
  }
  assert.equal(out[0], out[1], 'POP build order does not change the outcome');
});

test('an attack is held or lost at its victim; other POPs and their DDoS-protected customers are not charged', () => {
  const { ev, errors } = load({ seed: 5 });
  ev("ACT.start({});S.cash=1e9;S.lvl=6;S.nextFail=1e9;S.nextEvent=1e9;ACT.buildPop({city:'bne'});for(const c of ['syd','bne']){S.pops[c].bb={d:50};S.pops[c].rgen=3}");
  ev("S.transit=[{id:'tf',city:'syd',net:'cog',tier:2},{id:'tn',city:'bne',net:'cog',tier:0}];S.scrubs=[{city:'syd',tier:1}];S.scrubMode='always'");
  // Brisbane is struggling on its own (a 10G port for 200G of eyeballs), and has a DDoS-protected customer.
  ev("S.pops.bne.bb.d=200;S.biz.push({id:'sc',type:'scrub',name:'Shield',city:'bne',bw:1,rate:1000,mood:80,since:0})");
  ev("S.day=60;S.ev.ddos={id:'a',city:'syd',vec:'http',gbps:20,start:S.day,until:S.day+3,entry:{k:'t',id:'tf',lab:''}};compute()");
  assert.ok(ev("sfOf(R,'bne')") < 0.85, 'Brisbane is under water anyway');
  assert.ok(ev("sfOf(R,'syd')") >= 0.97, 'the victim is fine');
  assert.equal(ev('ddosSf(S.ev.ddos)'), ev("sfOf(R,'syd')"));
  ev('dayTick()');
  assert.deepEqual(JSON.parse(ev('JSON.stringify(S.ev.ddos.sla||[])')), [], 'no SLA payout for a customer in another city');
  assert.equal(ev('S.stats.sla||0'), 0);
  ev('S.day=S.ev.ddos.until;ddosExpire()');
  assert.equal(ev('S.stats.ddosOk||0'), 1, 'held at the victim');
  assert.equal(ev('S.stats.ddosLost||0'), 0);
  assert.deepEqual(errors, []);
});

test('fourteen attacks on a big network keep the save small, and 2.0 saves with entry ports still load', () => {
  const fs = require('node:fs'), path = require('node:path');
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'big-network.json'), 'utf8'));
  const { ev, errors } = load({ seed: 3 });
  ev(`S=migrate(JSON.parse(${JSON.stringify(JSON.stringify(fx.S || fx))}));UI.started=true;compute()`);
  const before = ev('JSON.stringify(S).length');
  ev("S.day=Math.max(S.day,50);for(let i=0;i<14;i++){S.ddosStarts=[];ddosAttack(false);}compute()");
  assert.equal(ev('ddosAll().length'), 14);
  assert.ok(ev('JSON.stringify(S).length') - before < 10000, 'a few hundred bytes per attack');
  // Saves from 2.0 and 2.1 brought each attack in on one port: that is dropped, and the attack spreads (#242).
  ev("S.ev.ddos.entries=Array.from({length:300},(_,i)=>({k:'p',id:'x'+i,city:S.ev.ddos.city,lab:'',share:1}));S.ev.ddos.entry={k:'t',lab:'Distributed ingress'};S=migrate(JSON.parse(JSON.stringify(S)));compute()");
  assert.equal(ev('S.ev.ddos.entries'), undefined);
  assert.equal(ev('S.ev.ddos.entry'), undefined);
  assert.equal(ev('ddosAll().length'), 14);
  assert.match(ev('ddosPanel()'), /🚨/);
  assert.deepEqual(errors, []);
});

test('spicy chaos stretches exactly the attack (or outage) an incident is about, and saves keep it', () => {
  const { ev, errors } = load({ seed: 99 });
  ev("beginGame('R','syd',{mode:'normal',preset:'bgp'});if(UI.pendGame)ACT.pitchSkip();S.cash=1e12;ACT.launchBB({city:'syd'});ACT.buyTransit({city:'syd',net:'cog',tier:1});ACT.buildPop({city:'mel'});S.links.push({id:'L',a:'syd',b:'mel',kind:'wave',tier:1,km:400,mo:1,cut:0});S.day=50");
  // A link that happens to be cut until the same day as the next attacks must stay as it is.
  ev("S.links[0].cut=S.day+2");
  // The third draw of an attack is its length: 0 makes it one day.
  for (let k = 0; k < 4; k++) ev("const old=Math.random;let n=0;Math.random=()=>n++===2?0:old();ddosAttack();Math.random=old");
  const rows = JSON.parse(ev("JSON.stringify(S.inc.filter(i=>i.type==='ddos').map(i=>[i.until,ddosAll(S,false).find(a=>a.id===i.atk).until]))"));
  assert.equal(rows.length, 4);
  for (const [inc, atk] of rows) { assert.equal(atk, inc, 'the attack lasts as long as its incident'); assert.equal(inc, 52, 'one day, stretched by half'); }
  assert.equal(ev('S.links[0].cut'), 52, 'an unrelated cut ending the same day is not stretched');
  // The longest spicy attack (7 days, stretched to 11) survives a reload.
  ev("S.ev.ddos.until=S.day+11;S=migrate(JSON.parse(JSON.stringify(S)))");
  assert.equal(ev('S.ev.ddos.until-S.day'), 11);
  ev("S.ev.ddos.until=S.day+40;S=migrate(JSON.parse(JSON.stringify(S)))");
  assert.equal(ev('S.ev.ddos.until-S.ev.ddos.start'), 11, 'but not longer');
  // Outages are found by their ref: a fiber cut stretches its own link only.
  ev("S.links.push({id:'M',a:'syd',b:'mel',kind:'wave',tier:1,km:400,mo:1,cut:S.day+4});S.links[0].cut=S.day+4;S.links[0].trench='T';addInc({type:'cut',ref:'T',until:S.day+4,msg:'x'})");
  assert.equal(ev("S.links[0].cut-S.day"), 6);
  assert.equal(ev("S.links.find(l=>l.id==='M').cut-S.day"), 4);
  assert.deepEqual(errors, []);
});

