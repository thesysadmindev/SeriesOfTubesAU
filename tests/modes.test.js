const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

test('sandbox: endless money, every unlock, nothing breaks, no badges', () => {
  const { ev, errors } = load();
  ev("ACT.modeSet({m:'sandbox'});ACT.start({})");
  assert.equal(ev("S.mode"), 'sandbox');
  assert.equal(ev("S.lvl"), ev("LEVELS.length"));
  assert.equal(ev("LEVELS.length"), 13);
  ev("S.cash=5;for(let i=0;i<120;i++)dayTick()");
  assert.ok(ev("S.cash") >= 1e8, 'money refills');
  assert.equal(ev("S.stats.incidents"), 0, 'no failures');
  assert.equal(ev("Object.keys(S.ach||{}).length"), 0, 'no badges in sandbox');
  assert.match(ev("document.getElementById('hAsn').textContent"), /Sandbox/);
  assert.deepEqual(errors, []);
});

test('traceroute shows hops, the exit and the AS path', () => {
  const { ev, errors } = load();
  ev("ACT.start({});S.cash=1e9;S.lvl=4;for(const g of GOALS)S.done[g.id]=0;ACT.launchBB({city:'syd'})");
  ev("ACT.buildPop({city:'mel'});UI.via=null;openLinkModal('syd','mel');ACT.buildLink({tier:1});closeModal();ACT.buyTransit({city:'mel',net:'tsy',tier:1});ACT.buyIx({city:'syd',tier:1});ACT.rs({city:'syd'});compute()");
  let r = JSON.parse(ev("JSON.stringify(traceroute('syd',{net:'nfx'}))"));
  assert.match(r.text, /traceroute to/);
  assert.match(r.text, /mel/, 'goes via Melbourne to transit');
  assert.deepEqual(r.asPath.slice(0, 2), [ev('S.asn'), ev("NET.tsy.asn")]);
  r = JSON.parse(ev("JSON.stringify(traceroute('syd',{net:'akm'}))"));
  assert.match(r.why, /peering/i, 'open network over the IX route server');
  r = JSON.parse(ev("JSON.stringify(traceroute('mel',{city:'syd'}))"));
  assert.match(r.text, /syd/);
  ev("S.links[0].cut=S.day+3;compute()");
  r = JSON.parse(ev("JSON.stringify(traceroute('syd',{net:'nfx'}))"));
  assert.ok(/unreachable/.test(r.text) || /peering/i.test(r.why));
  ev("ACT.trace({city:'syd'})");
  assert.match(ev("document.getElementById('modalCard').textContent"), /Traceroute/);
  ev("ACT.share()");
  assert.deepEqual(errors, []);
});

test('conferences: register, attend, and selective peers get easier for a while', () => {
  const { ev, errors } = load();
  ev("ACT.start({});S.cash=1e9;for(const g of GOALS)S.done[g.id]=0");
  ev("S.day=confDay(CONFS.find(c=>c.c==='syd'),0)-20;ACT.leftTab({t:'deals'})");
  assert.match(ev("document.getElementById('left').textContent"), /AusNOG/, "the Deals tab lists Sydney's conference");
  const key = ev("upcomingConfs(30).find(c=>c.c==='syd').key");
  ev(`ACT.confGo({key:'${key}'})`);
  const need0 = ev("(()=>{R.demTo.nfx=0;return peerOk('nfx','ix','syd').why})()");
  ev("for(let i=0;i<21;i++)dayTick()");
  assert.ok(ev("S.conf&&S.conf.until>S.day"), 'conference glow is on');
  const need1 = ev("(()=>{R.demTo.nfx=0;return peerOk('nfx','ix','syd').why})()");
  assert.notEqual(need0, need1, 'threshold dropped');
  ev("checkGoals()");
  assert.ok(ev("S.ach.hallway!==undefined"));
  assert.deepEqual(errors, []);
});

test('the guided tutorial walks through the first steps and can be skipped', () => {
  const { ev, dom, errors } = load();
  dom.window.__TUBES_TUT__ = true;
  ev("localStorage.removeItem('sot-tut');ACT.start({})");
  assert.equal(ev("document.getElementById('coach').hidden"), false);
  assert.match(ev("document.getElementById('coach').textContent"), /Launch broadband/);
  ev("ACT.launchBB({city:S.home});renderAll()");
  assert.match(ev("document.getElementById('coach').textContent"), /Step 2/);
  // Past the first link, the NBN: a POI near home, its POP and an NNI port.
  ev("S.tut=5;S.links.push({id:'x',a:'syd',b:'2cmp',kind:'wave',tier:0,km:50,mo:1,cut:0});renderAll()");
  assert.match(ev("document.getElementById('coach').textContent"), /Reach the NBN/);
  ev("S.cash=1e6;ACT.buildPop({city:'2cmp'});ACT.nniOrder({city:'2cmp',t:0});renderAll()");
  assert.doesNotMatch(ev("document.getElementById('coach').textContent"), /Reach the NBN/, 'done once an NNI is ordered');
  ev("ACT.tutSkip()");
  assert.equal(ev("document.getElementById('coach').hidden"), true);
  assert.equal(ev("localStorage.getItem('sot-tut')"), '1');
  assert.deepEqual(errors, []);
});

test('animations can be switched off, on or follow the system, and the choice sticks', () => {
  const { ev, errors } = load();
  ev("ACT.start({});ACT.menu()");
  assert.match(ev("document.getElementById('modalCard').textContent"), /Settings/);
  ev("ACT.settings()");
  assert.match(ev("document.getElementById('modalCard').textContent"), /Animations/);
  ev("ACT.animSet({v:'off'})");
  assert.equal(ev("document.documentElement.classList.contains('no-anim')"), true);
  assert.equal(ev("animOn()"), false);
  ev("floater(0,0,'x','#000')");
  assert.equal(ev("FLOATS.length"), 0, 'no floating text when off');
  assert.equal(ev("localStorage.getItem('sot-anim')"), 'off');
  ev("ACT.animSet({v:'on'})");
  assert.equal(ev("document.documentElement.classList.contains('anim-force')"), true);
  assert.equal(ev("animOn()"), true);
  ev("ACT.soundSet({v:'off'})");
  assert.equal(ev("UI.muted"), true);
  assert.deepEqual(errors, []);
});

test('half speed and deeper zoom', () => {
  const { ev, errors } = load();
  ev("ACT.start({});ACT.speed({v:0.5})");
  assert.equal(ev("UI.speed"), 0.5);
  assert.equal(ev("document.getElementById('sp0.5').classList.contains('on')"), true);
  ev("ACT.speed({v:7})");
  assert.equal(ev("UI.speed"), 0.5, 'bogus speeds are ignored');
  ev("cam.z=1;for(let i=0;i<40;i++)zoomAt(100,100,1.2)");
  assert.equal(ev("cam.z"), ev("ZMAX"), 'zooming in stops at the maximum');
  assert.ok(ev("ZMAX") >= 48, 'deep enough for dense regions (#126) and the POIs crowded in the capitals');
  assert.deepEqual(errors, []);
});

test('the map draws at every zoom, with and without animations, without throwing', () => {
  const { ev, errors } = load();
  ev("ACT.start({});S.cash=1e9;S.lvl=4;ACT.launchBB({city:'syd'});for(const c of ['mel','hba','bne'])ACT.buildPop({city:c});UI.via=null;openLinkModal('syd','mel');ACT.buildLink({tier:1});closeModal();compute()");
  for (const z of [0.35, 0.8, 1.4, 3, 6]) ev(`cam.z=${z};draw(performance.now());draw(0)`);
  ev("ACT.animSet({v:'off'});frame(performance.now()+16)");
  assert.ok(ev("ctx&&ctx.calls.n") > 100, 'the canvas was actually drawn on');
  assert.deepEqual(errors, []);
});

test('RouteScript: parses safely, reports errors helpfully, and changes routing', () => {
  const { ev, errors } = load();
  ev("ACT.start({});S.cash=1e9;S.lvl=4;for(const g of GOALS)S.done[g.id]=0;ACT.launchBB({city:'syd'})");
  ev("ACT.buyTransit({city:'syd',net:'cog',tier:1});ACT.buyTransit({city:'syd',net:'lvl',tier:1});ACT.coreUp();ACT.coreUp();ACT.buyTE();compute()");
  let p = JSON.parse(ev("JSON.stringify(teParse('spill at 80%\\ncap transit cogentle at 3 gbps\\nprefer ix for goggle\\nnonsense here\\navoid transit for gogle'))"));
  assert.equal(p.errors.length, 2, 'the nonsense line and the typo fail');
  assert.match(p.errors[1], /Did you mean Goggle/, 'typos get a suggestion');
  p = JSON.parse(ev("JSON.stringify(teParse('avoid transit for zzzzqqq').errors)"));
  assert.match(p[0], /unknown network/);
  assert.match(ev("teParse('drain adelade').errors[0]"), /Did you mean Adelaide/);
  assert.equal(ev("teParse('alert(1)').n"), 0, 'nothing is ever evaluated');
  const cog = "R.useT[S.transit.find(t=>t.net==='cog').id]||0";
  const before = ev(cog);
  ev("ACT.teEdit();document.getElementById('teSrc').value='cap transit cogentle at 3 gbps';ACT.teDeploy()");
  assert.ok(ev(cog) <= 3.0001 && before > 3, `Cogentle capped (${before} -> ${ev(cog)})`);
  assert.ok(ev("R.useT[S.transit.find(t=>t.net==='lvl').id]") > 0, 'overflow went to the other upstream');
  // a fat-fingered deploy earns its badge
  ev("ACT.teEdit();document.getElementById('teSrc').value='drain sydney\\ncap transit level tree at 0 gbps\\ncap transit cogentle at 0 gbps';ACT.teDeploy();checkGoals()");
  assert.ok(ev("S.ach.fat!==undefined"));
  // errors block a deploy
  ev("ACT.teEdit();document.getElementById('teSrc').value='spill at 5%';ACT.teDeploy()");
  assert.match(ev("document.getElementById('modalCard').textContent"), /commit failed/);
  ev("ACT.teClear()");
  assert.equal(ev("S.te.script"), '');
  assert.deepEqual(errors, []);
});

test('RouteScript BGP: local-pref and prepending move transit, protected customers go first, the optimizer drafts a script', () => {
  const { ev, errors } = load();
  ev("ACT.start({});S.cash=1e9;S.lvl=4;for(const g of GOALS)S.done[g.id]=0;ACT.launchBB({city:'syd'})");
  ev("ACT.buyTransit({city:'syd',net:'cog',tier:1});ACT.buyTransit({city:'syd',net:'lvl',tier:1});ACT.coreUp();ACT.coreUp();ACT.buyTE();for(let i=0;i<30;i++)dayTick();compute()");
  const use = n => ev(`R.useT[S.transit.find(t=>t.net==='${n}').id]||0`);
  assert.match(ev('teOptimize()'), /peers at IX Straya/, 'the optimizer points at the exchange where your transit traffic peers');
  const p = JSON.parse(ev("JSON.stringify(teParse('prefer transit level tree\\navoid transit cogentle\\nprepend transit cogentle 2\\nprotect customers\\nprepend transit cogentle 9'))"));
  assert.equal(p.n, 4);
  assert.match(p.errors[0], /prepend 1 to 3/);
  assert.equal(p.up.lvl, 'prefer');
  assert.equal(p.prep.cog, 2);
  ev("S.te.script='prefer transit level tree';compute()");
  assert.ok(use('cog') < 1e-6 && use('lvl') > 0, 'local-pref sends everything to the preferred upstream');
  const tot = use('lvl');
  ev("S.te.script='prepend transit level tree 2';compute()");
  assert.ok(use('lvl') < tot * 0.5 && use('cog') > 0, 'prepending moves traffic off, but not all of it');
  assert.ok(Math.abs(use('lvl') + use('cog') - tot) < 0.5, 'nothing is lost');
  // Congest the city, then protect business customers: they keep their service, home users take the hit.
  ev("S.biz.push({id:uid(),city:'syd',city2:null,reqs:[],name:'Test DIA',type:'dia',bw:5,rate:600,mood:100,since:0});S.pops.syd.bb.d*=40;S.te.script='';compute()");
  const plain = ev("bizSf(S.biz[S.biz.length-1])");
  assert.ok(plain < 0.95, `the city is congested (${plain})`);
  ev("S.te.script='protect customers';compute()");
  assert.ok(ev("bizSf(S.biz[S.biz.length-1])") >= 0.95, 'protected customer stays happy (95%+ served)');
  assert.ok(ev("sfOf(R,'syd')") <= plain + 0.01, 'the city as a whole is not better off');
  const draft = ev('teOptimize()');
  assert.match(draft, /spill at 85%/);
  assert.match(draft, /protect customers/);
  assert.match(draft, /prefer transit cogentle/);
  assert.equal(ev('teParse(teOptimize()).errors.length'), 0, 'the draft is a valid script');
  // With room to spare, protecting customers would only cost a second routing pass, so it is not suggested.
  ev("S.pops.syd.bb.d=5;S.te.script='';compute()");
  assert.ok(ev("sfOf(R,'syd')") >= 0.95);
  assert.doesNotMatch(ev('teOptimize()'), /protect customers/);
  ev("S.te.script='';ACT.teEdit();ACT.teOpt()");
  assert.match(ev("document.getElementById('teSrc').value"), /Suggested by the optimizer/);
  assert.deepEqual(errors, []);
});

test('#27 new networks get a random name, and "Another one" never repeats it', () => {
  const { ev, errors } = load();
  assert.ok(ev("NETWORK_NAMES.every(n=>n.length<=24)&&new Set(NETWORK_NAMES).size===NETWORK_NAMES.length"));
  const first = ev("document.getElementById('nmIn').value");
  assert.ok(ev(`NETWORK_NAMES.includes(${JSON.stringify(first)})`));
  let prev = first;
  for (let i = 0; i < 40; i++) {
    ev("ACT.randomName()");
    const now = ev("document.getElementById('nmIn').value");
    assert.notEqual(now, prev);
    prev = now;
  }
  ev("document.getElementById('nmIn').value='My Own Net';ACT.start({})");
  assert.equal(ev("S.name"), 'My Own Net');
  assert.deepEqual(errors, []);
});

test('iPhone home-screen app fills the screen when iOS reports a short viewport', () => {
  const { ev, dom, errors } = load();
  const w = dom.window;
  const set = (o, k, v) => Object.defineProperty(o, k, { value: v, configurable: true });
  set(w.navigator, 'userAgent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148');
  set(w.navigator, 'standalone', true);
  set(w, 'screen', { width: 390, height: 844 });
  set(w, 'innerWidth', 390); set(w, 'innerHeight', 797);   // one status bar short
  ev('resize()');
  assert.equal(ev("document.documentElement.classList.contains('iosfix')"), true);
  assert.equal(ev("document.documentElement.style.getPropertyValue('--app-h')"), '844px');
  assert.equal(ev('CH'), 844, 'the map is drawn to the real bottom');
  // landscape: the short side of the screen
  set(w, 'innerWidth', 844); set(w, 'innerHeight', 370);
  ev('resize()');
  assert.equal(ev('CH'), 390);
  // once fixed, iOS reports a full viewport: the fix must stay on, or the strip comes back
  set(w, 'innerWidth', 390); set(w, 'innerHeight', 844);
  ev('resize()');
  assert.equal(ev("document.documentElement.classList.contains('iosfix')"), true);
  assert.equal(ev('CH'), 844);
  // Safari in a tab leaves the page alone
  set(w.navigator, 'standalone', false); set(w, 'innerHeight', 700);
  ev('resize()');
  assert.equal(ev("document.documentElement.classList.contains('iosfix')"), false);
  assert.equal(ev('CH'), 700);
  assert.deepEqual(errors, []);
});

test('phones in the browser get the install pitch before a new game, then can still play', () => {
  const { ev, dom, errors } = load();
  const w = dom.window;
  const set = (o, k, v) => Object.defineProperty(o, k, { value: v, configurable: true });
  set(w.navigator, 'userAgent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1');
  set(w, 'innerWidth', 390); set(w, 'innerHeight', 760);
  ev('showTitle()');
  assert.match(ev("document.getElementById('modal').textContent"), /Best played as an app/, 'title screen card');
  ev('ACT.start({})');
  const modal = () => ev("document.getElementById('modal').textContent");
  assert.equal(ev('!!S&&UI.started'), false, 'the game waits for the pitch');
  assert.match(modal(), /Play it as an app/);
  assert.match(modal(), /does not carry over/, 'iPhone players learn to install first');
  assert.match(modal(), /Add to Home Screen/);
  ev('ACT.pitchSkip()');
  assert.equal(ev('UI.started&&!!S.pops[S.home]'), true, 'playing in the browser still works');
  // only once per session
  ev('ACT.newgame();ACT.start({})');
  assert.equal(ev('UI.started'), true);
  assert.deepEqual(errors, []);
});

test('the installed app and desktop browsers start straight away', () => {
  for (const [w0, sa] of [[390, true], [1280, false]]) {
    const { ev, dom, errors } = load();
    const w = dom.window;
    const set = (o, k, v) => Object.defineProperty(o, k, { value: v, configurable: true });
    set(w.navigator, 'userAgent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15');
    set(w.navigator, 'standalone', sa);
    set(w, 'innerWidth', w0); set(w, 'innerHeight', 760);
    ev('ACT.start({})');
    assert.equal(ev('UI.started'), true, `width ${w0}, standalone ${sa}`);
    assert.deepEqual(errors, []);
  }
});

test('#34 the customer level is always in view, and no puzzles or scenarios are left in the menus', () => {
  const { ev, dom, errors } = load();
  ev('ACT.start({})');
  ev("UI.left='goals';UI.leftOpen=true;UI.sel=null;renderAll()");
  assert.match(dom.window.document.getElementById('leftBody').textContent, /Customer level 1 of 13/);
  assert.match(ev("$('hTier').textContent"), /Lv 1/);
  assert.equal(ev("!!document.getElementById('hScn')||!!document.getElementById('pzBox')"), false, 'no scenario chip or puzzle card');
  ev('ACT.menu()');
  const menu = dom.window.document.getElementById('modalCard').innerHTML;
  assert.doesNotMatch(menu, /data-act="(puzzleMenu|scenarios)"/, 'the menu has no puzzles or scenarios');
  ev('closeModal();showTitle()');
  assert.deepEqual(JSON.parse(ev("JSON.stringify([...document.querySelectorAll('#modal .door')].map(d=>d.dataset.door))")), ['sandbox', 'normal'], 'two doors on the title screen');
  assert.equal(ev("typeof ACT.puzzleMenu+typeof ACT.scenarios+typeof ACT.startScn+typeof ACT.startWeekly"), 'undefinedundefinedundefinedundefined');
  assert.deepEqual(errors, []);
});
test('NOC dashboard has a tab bar for its sections', () => {
  const { ev, errors } = load();
  ev("ACT.start({});ACT.dash()");
  const card = () => ev("document.getElementById('dashCard').textContent");
  assert.match(card(), /Traffic by way out/);
  assert.doesNotMatch(card(), /Busiest links/);
  for (const [k, re] of [['cust', /Customers/], ['conn', /Every port that connects/], ['traffic', /Traffic by network/], ['infra', /Busiest links/]]) {
    ev(`ACT.dashTab({k:'${k}'})`);
    assert.match(card(), re, k);
  }
  ev("ACT.dashTab({k:'nope'})");
  assert.equal(ev('UI.dtab'), 'infra', 'unknown tabs are ignored');
  assert.deepEqual(errors, []);
});

test('a brand-new phone player can click through the install pitch and the title screen buttons', () => {
  const { ev, dom, errors } = load();
  const w = dom.window, doc = w.document;
  Object.defineProperty(w, 'innerWidth', { value: 390, configurable: true });
  ev('showTitle()');
  assert.equal(ev('S'), null, 'no game yet');
  const click = (sel) => { const el = doc.querySelector(sel); assert.ok(el, sel); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
  click('#modal [data-act="settings"]');
  assert.match(doc.getElementById('modal').textContent, /Pause when a customer is furious/, 'Settings opens before any game exists');
  click('#modal [data-act="settingsClose"]');
  click('#modal [data-act="start"]');
  assert.match(doc.getElementById('modal').textContent, /Play it as an app/);
  click('#modal .cta [data-act="pitchSkip"]');
  assert.equal(ev('!!(S&&UI.started)'), true, 'Play in the browser anyway really starts the game');
  assert.deepEqual(errors, []);
});

test('there is no chat link: not on the title screen, in the menu or in How to play', () => {
  const { ev, errors } = load();
  const chat = () => ev("document.querySelectorAll('#modal a[href*=\"signal.group\"]').length");
  ev('showTitle()');
  assert.equal(chat(), 0, 'title');
  assert.doesNotMatch(ev("document.getElementById('modalCard').textContent"), /Signal/);
  ev('ACT.start({})');
  for (const s of ['ACT.menu()', 'showHelp()']) { ev(s); assert.equal(chat(), 0, s); }
  assert.deepEqual(errors, []);
});

test('RouteScript: help, ready-made scripts and the AI button', () => {
  const { ev, errors } = load();
  ev("ACT.start({});S.cash=1e9;S.lvl=4;for(const g of GOALS)S.done[g.id]=0;ACT.launchBB({city:'syd'})");
  ev("ACT.buyTransit({city:'syd',net:'cog',tier:1});ACT.buyTransit({city:'syd',net:'lvl',tier:1});ACT.coreUp();ACT.coreUp();ACT.buyTE();compute()");
  // every ready-made script parses on a real network and is listed in the help
  for (const id of JSON.parse(ev('JSON.stringify(TE_RECIPES.map(r=>r.id))')))
    assert.deepEqual(JSON.parse(ev(`JSON.stringify(teParse(TE_RECIPES.find(r=>r.id==='${id}').src().join('\\n')).errors)`)), [], id);
  ev("ACT.teEdit();document.getElementById('teSrc').value='spill at 90%';ACT.teHelp()");
  const help = ev("document.getElementById('modalCard').textContent");
  assert.match(help, /How RouteScript works/);
  assert.match(help, /Penny Pincher/);
  assert.equal(ev("document.querySelectorAll('[data-act=\"teRecipe\"]').length"), ev('TE_RECIPES.length'));
  ev("ACT.teBack()");
  assert.equal(ev("document.getElementById('teSrc').value"), 'spill at 90%', 'the help keeps your draft');
  ev("ACT.teRecipe({id:'pinch'})");
  assert.match(ev("document.getElementById('teSrc').value"), /prefer transit cogentle/);
  // the AI writes a script that parses and does not lose traffic...
  const served = ev('R.served');
  ev('Math.random=()=>0.5;ACT.teSlop()');
  const good = ev("document.getElementById('teSrc').value");
  assert.match(good, /Written by/);
  assert.equal(ev(`teParse(${JSON.stringify(good)}).errors.length`), 0);
  assert.ok(ev(`teTrial(${JSON.stringify(good)}).after.served`) >= served * 0.99);
  assert.equal(ev('R.served'), served, 'thinking about it changes nothing');
  ev('ACT.teDeploy()');
  assert.equal(ev('S.te.script'), good);
  // ...except sometimes, and it is just as sure of itself
  ev('Math.random=()=>0.001;ACT.teEdit();ACT.teSlop()');
  const bad = ev("document.getElementById('teSrc').value");
  assert.match(bad, /cap transit cogentle at 0 gbps/);
  assert.match(bad, /Confidence: 100%/);
  assert.ok(ev(`teTrial(${JSON.stringify(bad)}).after.served`) < served * 0.5, 'it takes the network down');
  ev('ACT.teDeploy()');
  assert.match(ev("document.getElementById('toasts').textContent"), /The AI apologises/);
  ev('ACT.teEdit();ACT.teSlop();ACT.teHelp();ACT.teBack()');
  ev("UI.dtab='overview';renderAll()");
  assert.deepEqual(errors, []);
});

