const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

function setup(ev) {
  ev("ACT.start({});S.cash=1e8;for(const g of GOALS)S.done[g.id]=0");
}

test('Rackstar requests require enough Crowdflare traffic and a free router port', () => {
  const { ev, errors } = load();
  setup(ev);
  ev("S.pops.syd.bb={d:9.9/NSH.cfl};compute();ACT.cache({city:'syd',net:'cfl'})");
  assert.equal(ev('S.caches.length'), 0, 'below the traffic threshold');
  ev("S.pops.syd.bb.d=10/NSH.cfl;compute();selectCity('syd');ACT.tab({t:'peer'})");
  assert.match(ev("document.getElementById('panelBody').textContent"), /Rackstar/);
  const cash = ev('S.cash');
  const ports = ev("portsUsed('syd')");
  ev("ACT.cache({city:'syd',net:'cfl'})");
  assert.equal(ev('S.caches.length'), 1, 'eligible at exactly 10 Gbps');
  assert.equal(ev('S.cash'), cash, 'hardware is free');
  assert.equal(ev("portsUsed('syd')"), ports + 1);
  assert.equal(ev('R.cost.caches'), ev('CACHE_MO'));
  ev("while(portsUsed('syd')<portsMax('syd'))ACT.cache({city:'syd',net:'cfl'})");
  const boxes = ev('S.caches.length');
  ev("ACT.cache({city:'syd',net:'cfl'})");
  assert.equal(ev('S.caches.length'), boxes, 'a full router refuses another box');
  assert.deepEqual(errors, []);
});

test('Rackstar serves cacheable Crowdflare traffic locally and overflow uses transit', () => {
  const { ev, errors } = load();
  setup(ev);
  ev("S.pops.syd.rgen=RG_TOP;S.pops.syd.bb={d:200/NSH.cfl};ACT.buyTransit({city:'syd',net:'cog',tier:PORT.length-1});ACT.lagT({id:S.transit[0].id,d:1});ACT.lagT({id:S.transit[0].id,d:1});compute()");
  const transit = ev('R.useT[S.transit[0].id]');
  ev("ACT.cache({city:'syd',net:'cfl'})");
  assert.equal(ev('R.useCache[S.caches[0].id]'), ev('CACHE_CAP'), 'first box fills to 100G');
  assert.ok(Math.abs(ev('R.useT[S.transit[0].id]') - (transit - 100)) < 1e-6);
  ev("ACT.cache({city:'syd',net:'cfl'})");
  assert.ok(Math.abs(ev('Object.values(R.useCache).reduce((a,b)=>a+b,0)') - 170) < 1e-6, '85% is cacheable, the rest still needs an external exit');
  ev("ACT.rmCache({id:S.caches[0].id});ACT.rmCache({id:S.caches[0].id})");
  assert.ok(Math.abs(ev('R.useT[S.transit[0].id]') - transit) < 1e-6, 'removal returns traffic to transit');
  assert.deepEqual(errors, []);
});

test('Rackstar boxes survive save migration and appear on phone peering panels in every language', () => {
  for (const lang of ['en', 'it', 'pt', 'fr', 'es', 'de']) {
    const { dom, ev, errors } = load(lang === 'en' ? {} : { lang });
    setup(ev);
    ev('window.matchMedia=()=>({matches:true})');
    ev("S.pops.syd.bb={d:10/NSH.cfl};compute();ACT.cache({city:'syd',net:'cfl'});save();S=migrate(JSON.parse(slotRaw(UI.slot)));compute()");
    assert.equal(ev("S.caches.filter(x=>x.net==='cfl').length"), 1, lang);
    assert.ok(ev('R.useCache[S.caches[0].id]') > 0, lang);
    for (const [width, height] of [[360, 800], [800, 360]]) {
      dom.window.innerWidth = width;
      dom.window.innerHeight = height;
      ev("selectCity('syd');ACT.tab({t:'peer'});renderAll()");
      assert.match(dom.window.document.getElementById('panelBody').textContent, /Rackstar/, lang);
    }
    assert.deepEqual(errors, [], lang);
    dom.window.close();
  }
});

test('big selective peers refuse in some cities, with a reason, and only for a while', () => {
  const { ev, errors } = load();
  setup(ev);
  const r = JSON.parse(ev(`(()=>{let tot=0,hit=0,small=0,ex=null;
    for(const n of NETS){for(const c of ALLC){const sn=snub(n.id,c);
      if(!bigPeer(n)){if(sn)small++;continue;}tot++;if(sn){hit++;ex=ex||{id:n.id,c,sn};}}}
    return JSON.stringify({tot,hit,small,ex});})()`));
  assert.equal(r.small, 0, 'small networks never snub');
  assert.ok(r.hit > 0 && r.hit < r.tot * 0.4, `some but not most pairs snub (${r.hit}/${r.tot})`);
  const { id, c, sn } = r.ex;
  assert.equal(ev(`JSON.stringify(snub('${id}','${c}'))`), JSON.stringify(sn), 'stable when asked again');
  const why = ev(`peerOk('${id}','ix','${c}').why`);
  assert.match(why, /reconsider in \d+ day/);
  assert.equal(ev(`peerOk('${id}','pni','${c}').snub===true`), sn.all, 'PNI is only refused for region-wide snubs');
  ev(`S.day=${sn.until}`);
  assert.equal(ev(`!!(snub('${id}','${c}')&&snub('${id}','${c}').until===${sn.until})`), false, 'the window ends');
  assert.deepEqual(errors, []);
});

test('a snubbing peer tears down an existing session and the Request button explains why', () => {
  const { ev, errors } = load();
  setup(ev);
  const k = ev(`(()=>{const ok=['syd','mel','hba','adl','bne','drw','sin','lax','hkg','tyo','per','cbr'];
    for(let d=0;d<600;d++)for(const n of NETS)for(const c of ok){if(!ixMembers(c).includes(n.id))continue;
      S.day=d;const a=snub(n.id,c);S.day=d+1;const b=snub(n.id,c);S.day=0;if(!a&&b)return n.id+'@'+c+'@'+d;}})()`);
  assert.ok(k, 'found a snub starting at an IX');
  const [id, c, d] = k.split('@');
  ev(`S.day=${d}`);
  ev(`ACT.buildPop({city:'${c}'});ACT.buyIx({city:'${c}',tier:1});S.peers['${id}@${c}']=true;compute()`);
  assert.equal(ev(`ixSessions('${c}').has('${id}')`), true);
  ev('dayTick()');
  assert.equal(ev(`!!S.peers['${id}@${c}']`), false, 'session torn down');
  assert.ok(ev(`S.log.some(e=>/de-peered you/.test(e.t))`));
  ev(`selectCity('${c}');ACT.tab({t:'peer'})`);
  assert.match(ev("document.getElementById('panelBody').textContent"), /reconsider in/);
  assert.deepEqual(errors, []);
});

test('Change Freeze never refuses or tears down a session at an exchange; On-call does', () => {
  const { ev, errors } = load();
  setup(ev);
  const k = ev(`(()=>{const ok=['syd','mel','hba','adl','bne','drw','sin','lax','hkg','per'];
    for(let d=0;d<600;d++)for(const n of NETS)for(const c of ok){if(!ixMembers(c).includes(n.id))continue;
      S.day=d;const a=snub(n.id,c);S.day=d+1;const b=snub(n.id,c);S.day=0;if(!a&&b)return n.id+'@'+c+'@'+d;}})()`);
  assert.ok(k, 'found a snub starting at an IX');
  const [id, c, d] = k.split('@');
  ev(`S.rules=makeRules('freeze');S.day=${d}`);
  ev(`ACT.buildPop({city:'${c}'});ACT.buyIx({city:'${c}',tier:1});S.peers['${id}@${c}']=true;compute()`);
  ev('dayTick()');
  assert.equal(ev(`!!S.peers['${id}@${c}']`), true, 'the session survives the freeze');
  assert.equal(ev(`snub('${id}','${c}')`), null, 'and nobody refuses a new one');
  assert.equal(ev(`ixSessions('${c}').has('${id}')`), true);
  assert.equal(ev('S.stats.depeered||0'), 0);
  ev(`S.rules=makeRules('oncall');S.day=${+d + 1}`);
  assert.ok(ev(`!!snub('${id}','${c}')`), 'On-call still snubs the same pair');
  assert.deepEqual(errors, []);
});

test('remote peering is offered but costs more, gives less and gets refused more', () => {
  const { ev, errors } = load();
  setup(ev);
  const fab = ev("(FABS.find(f=>f.cities.includes('syd')&&f.cities.includes('mel'))||{}).id");
  assert.ok(fab, 'a fabric covers fra and ams');
  ev(`ACT.buyNni?ACT.buyNni({city:'syd',prov:'${fab}',tier:1}):0`);
  ev(`if(!S.links.some(l=>l.kind==='vxc')){const km=kmBetween('syd','mel');S.links.push({id:uid(),a:'syd',b:'mel',kind:'vxc',prov:'${fab}',vt:1,km,sub:false,mo:vxcMo(km,false,1),cut:0,day:S.day})}`);
  assert.ok(ev("remoteCities().includes('mel')"));
  ev("selectCity('mel');ACT.tab({t:'peer'})");
  const txt = () => ev("document.getElementById('panelBody').textContent");
  ev("ACT.buyIx({city:'mel',tier:1});compute()");
  assert.equal(ev("isRemote('mel')"), true);
  assert.equal(ev("ixPortMo('mel',1)"), ev("Math.round(PORT[1].ix*1.5*ixMul('mel'))"), 'reseller markup');
  assert.equal(ev("ixCap('mel')"), ev("PORT[1].g*0.8"), 'oversubscribed port');
  const refusers = JSON.parse(ev("JSON.stringify(ixMembers('mel').filter(id=>noRemote(id)&&!snub(id,'mel')))"));
  assert.ok(refusers.length > 0, 'some members refuse remote peers');
  const r = JSON.parse(ev(`JSON.stringify(peerOk('${refusers[0]}','ix','mel'))`));
  assert.equal(r.ok, false); assert.equal(r.remote, true);
  assert.equal(ev(`noRemote('drz')`), false, 'open networks still peer, also via the route server');
  ev("ACT.rs({city:'mel'});compute()");
  assert.ok(ev("ixSessions('mel').size") > 0);
  ev("selectCity('mel');ACT.tab({t:'peer'})");
  assert.match(txt(), /refuse remote peers/);
  ev("ACT.buildPop({city:'mel'});compute()");
  assert.equal(ev("isRemote('mel')"), false, 'a real POP makes it local again');
  assert.equal(ev(`peerOk('${refusers[0]}','ix','mel').remote`), undefined);
  assert.deepEqual(errors, []);
});

test('a peer at a rival exchange can de-peer you without stopping the game', () => {
  const { ev, errors } = load();
  ev('ACT.start({})');
  const ix = ev('Object.keys(XIXM)[0]');
  ev(`S.peers['ggl@${ix}']=true;window.snub=()=>({why:'Testing.'})`);
  ev('dayTick()');
  assert.equal(ev(`'ggl@${ix}' in S.peers`), false);
  assert.match(ev("document.getElementById('toasts').textContent"), new RegExp(`de-peered you at ${ev(`ixName('${ix}')`)} in ${ev(`CITY[ixCity('${ix}')].name`)}`));
  assert.deepEqual(errors, []);
});

test('an IX meltdown at a rival exchange names it, and a failing day tick does not stop the game', () => {
  const { ev, errors } = load();
  ev("ACT.start({});S.cash=1e8;ACT.buyIx({city:'syd~2',tier:1});S.day=100");
  const src = ev('fireFailure.toString()').replace(/^function fireFailure/, 'function')
    .replace('let tot=opts.reduce', "opts.splice(0,opts.length,['ixloop',1]);let tot=opts.reduce");
  ev('window.__ff=' + src);
  ev('__ff()');
  assert.ok(ev("S.inc.find(i=>i.type==='ixloop').msg.includes(ixName('syd~2'))"));
  // a tick that throws is caught, reported once, and the loop keeps going
  ev("const dt0=dayTick;window.dayTick=()=>{throw new Error('boom')};UI.speed=1;acc=DAY_MS;last=0;frame(16);window.dayTick=dt0");
  assert.equal(ev('UI.tickErr'), true);
  assert.match(ev("document.getElementById('toasts').textContent"), /NOC glitched/);
  assert.deepEqual(errors.filter(e => !/tick failed/.test(e)), []);
});

