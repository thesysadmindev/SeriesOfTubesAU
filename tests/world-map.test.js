// The world map around Australia: it wraps, only the overseas PoPs that matter to Australian traffic (and the cable
// landing stations on the way) are on it, and transit, caches, PNIs and space are a data centre thing. POIs are handover points, the overseas PoPs are for peering, and Megapork backhauls
// from overseas at a premium over the cables.
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

const J = (ev, s) => JSON.parse(ev(`JSON.stringify(${s})`));

test('the map is the whole world and wraps: zoomed out it repeats, and a cable is drawn the short way round', () => {
  const { ev, errors } = load();
  ev('ACT.start({})');
  assert.equal(ev('W'), 8471);
  // Australia keeps the scale it had alone: Sydney to Perth is as wide as it was.
  assert.ok(Math.abs(ev('CITY.syd.x-CITY.per.x') - 843) < 5, `${ev('CITY.syd.x-CITY.per.x')} map px, 843 on the Australia-only map`);
  ev('cam.z=0.12;cam.x=100');
  assert.ok(ev('visibleKs().length') >= 2, 'more than one copy on screen when zoomed out at the seam');
  ev('cam.x=-50;wrapCam()');
  assert.ok(ev('cam.x') > 0 && ev('cam.x') < ev('W'), 'panning past the seam comes round');
  // Every cable is one continuous line: no step jumps across the map.
  const jumps = J(ev, 'CABLE_PAIRS.filter(p=>p.pts.some((q,i)=>i&&Math.abs(q[0]-p.pts[i-1][0])>W/4)).map(p=>p.cid+":"+p.a+"-"+p.b)');
  assert.deepEqual(jumps, []);
  assert.ok(ev('Math.abs(wrapDx(CITY.syd.x,CITY.lax.x))<W/2'));
  assert.deepEqual(errors, []);
});

test('overseas: the peering hubs, and the cable landing stations on the way, each a PoP of its own', () => {
  const { ev, errors } = load();
  assert.deepEqual(J(ev, "CITIES.filter(c=>c.gw&&!c.ls).map(c=>c.id).sort()"), ['akl', 'hkg', 'iad', 'kul', 'lax', 'lon', 'mrs', 'sin', 'sjc', 'tyo']);
  assert.deepEqual(J(ev, "CITIES.filter(c=>c.ls).map(c=>c.id).sort()"), ['cgk', 'gum', 'hnl', 'mct', 'suv']);
  assert.equal(ev('CABLE_PAIRS.every(p=>!!CITY[p.a]&&!!CITY[p.b])'), true, 'every cable runs between real cities');
  // A cable through a landing station stops there: no pair runs past Guam, Fiji, Hawaii, Jakarta or Oman.
  for (const [a, b] of [['syd', 'tyo'], ['bne', 'tyo'], ['syd', 'lax'], ['syd', 'sjc'], ['per', 'mrs'], ['drw', 'sin']]) {
    assert.deepEqual(J(ev, `cablesFor('${a}','${b}').map(c=>c.cid)`), [], `${a}–${b} runs straight past a landing station`);
  }
  // Every cable from Australia reaches a PoP: its far end is a hub or a landing station you can build in.
  assert.deepEqual(J(ev, "CABLE_PAIRS.filter(p=>[p.a,p.b].some(c=>!CITY[c].au&&!CITY[c].gw)).map(p=>p.cid)"), []);
  assert.deepEqual(errors, []);
});

test('a cable through a landing station needs a PoP there; nothing else is sold at one', () => {
  const { ev, errors } = load();
  ev("ACT.start({});S.cash=1e9;S.lvl=6;ACT.buildPop({city:'tyo'})");
  assert.equal(ev("cablesFor('syd','tyo').length"), 0, 'no Sydney–Tokyo pair: the cables stop at Guam');
  const L = (a, b, v) => ev(`UI.via='${v}';UI.lmode='wave';openLinkModal('${a}','${b}');ACT.buildLink({tier:1});closeModal()`);
  L('syd', 'gum', 'guam'); L('gum', 'tyo', 'guam');
  assert.equal(ev("!!S.pops.gum"), true, 'the link to Guam builds the PoP there');
  assert.equal(ev("S.links.filter(l=>l.kind==='wave').length"), 2);
  assert.equal(ev("pathExists('syd','tyo')"), true, 'Sydney reaches Tokyo through Guam');
  // Nothing to buy at Guam: no transit, exchange, PNI, cache, space or homes.
  assert.equal(ev("NETS.some(n=>sellsAt(n,'gum'))||ixIdsIn('gum').length>0||inDc('gum')||dcOk('gum')||homesAt('gum')||custAt('gum')"), false);
  ev("selectCity('gum');UI.tab='cust';renderPanel()");
  assert.match(ev("document.getElementById('panelBody').textContent"), /A cable landing station/);
  assert.doesNotMatch(ev("document.getElementById('panelBody').textContent"), /Business customers/, 'nobody to sign here');
  ev("UI.tab='peer';renderPanel()");
  assert.match(ev("document.getElementById('panelBody').textContent"), /This isn't a data centre/);
  assert.deepEqual(errors, []);
});

test('caches, PNIs and data centre space are bought in data centres, never at a POI', () => {
  const { ev, errors } = load();
  ev("ACT.start({});S.cash=1e9;S.lvl=6;ACT.buyTransit({city:'syd',net:'tsy',tier:1});for(const c of ['2prt','asp','sin'])ACT.buildPop({city:c});compute();R.demTo.akm=1e4");
  for (const c of ['2prt', 'asp']) {
    ev(`ACT.cache({city:'${c}',net:'akm'})`);
    assert.equal(ev(`S.caches.some(x=>x.city==='${c}')`), false, `no cache at ${c}`);
    assert.equal(ev(`pniQuote('${c}','tsy',1)`), null, `no PNI at ${c}`);
    assert.equal(ev(`DC_T.some((x,t)=>dcCan('${c}',t))`), false, `no space at ${c}`);
  }
  assert.equal(ev("!!pniQuote('syd','tsy',1)"), true, 'a paid PNI in a Sydney data centre');
  ev("R.demTo.akm=1e4;ACT.cache({city:'syd',net:'akm'})");
  assert.equal(ev("S.caches.some(x=>x.city==='syd')"), true, 'a cache in a data centre');
  assert.equal(ev("dcOk('sin')"), false, 'no racks to rent overseas: no customers there');
  ev("selectCity('2prt');UI.tab='peer';renderPanel()");
  assert.match(ev("document.getElementById('panelBody').textContent"), /This isn't a data centre/);
  // A save with a cache or PNI at a POI loses it on load.
  ev("S.caches.push({id:'c1',city:'2prt',net:'akm',site:'a'});S.pni.push({id:'p1',city:'2prt',net:'tsy',tier:1,ready:0});sanitize(S)");
  assert.equal(ev("S.caches.some(x=>x.city==='2prt')||S.pni.some(x=>x.city==='2prt')"), false);
  assert.deepEqual(errors, []);
});

test('every Next-Door-DC and Equinox site is on the map, by its real code', () => {
  const { ev, errors } = load();
  ev('ACT.start({})');
  const sites = J(ev, "Object.fromEntries(CITIES.filter(c=>inDc(c.id)).map(c=>[c.id,dcSites(c.id)]))");
  assert.deepEqual(sites.syd, ['Next-Door-DC S1, S2, S3, S6', 'Equinox SY1, SY2, SY3, SY4, SY5, SY6, SY9']);
  assert.deepEqual(sites.mel, ['Next-Door-DC M1, M2, M3', 'Equinox ME1, ME2, ME4, ME5']);
  for (const [c, code] of [['bne', 'B1'], ['per', 'P2'], ['adl', 'A1'], ['cbr', 'C1'], ['drw', 'D1'], ['mcy', 'SC1'], ['phe', 'PH1'], ['nwm', 'NE1'], ['kul', 'KL1']])
    assert.ok(sites[c].some(x => x.startsWith('Next-Door-DC') && x.includes(code)), `Next-Door-DC ${code} in ${c}`);
  for (const [c, code] of [['bne', 'BR1'], ['per', 'PE3'], ['adl', 'AE1'], ['cbr', 'CA1'], ['wol', 'SY7']])
    assert.ok(sites[c].some(x => x.startsWith('Equinox') && x.includes(code)), `Equinox ${code} in ${c}`);
  // The edge sites are real data centres: you can start there and buy transit.
  for (const c of ['phe', 'nwm']) assert.equal(ev(`isDc('${c}')&&homeOk('${c}')`), true, c);
  // A network's building is one of the real sites.
  assert.match(ev("siteName('syd','a')"), /^Next-Door-DC S[1236]$/);
  ev("selectCity('mel');renderPanel()");
  assert.match(ev("document.getElementById('panelBody').textContent"), /Data centres: Next-Door-DC M1, M2, M3, Equinox ME1/);
  assert.deepEqual(errors, []);
});

test('every Australian town is drawn on land: the city lenses never fold the map', () => {
  const { ev, errors } = load();
  const off = J(ev, `(()=>{const inR=(x,y,r)=>{let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const [xi,yi]=r[i],[xj,yj]=r[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;};
    return CITIES.filter(c=>c.au&&COAST.filter(r=>inR(c.x,c.y,r)).length%2===0).map(c=>c.id);})()`);
  assert.deepEqual(off, [], 'drawn in the sea');
  // Along any ray out of a lens, points further out stay further out (Traralgon used to overtake the coast).
  const folds = ev(`(()=>{let n=0;for(const L of LENSES)for(let a=0;a<64;a++)for(let s=0.05;s<4;s+=0.05){const t=a/64*2*Math.PI,dx=Math.cos(t),dy=Math.sin(t),p=proj(L.lon+dx*s,L.lat+dy*s),q=proj(L.lon+dx*(s+0.01),L.lat+dy*(s+0.01)),d0=proj0(L.lon+dx*s,L.lat+dy*s),d1=proj0(L.lon+dx*(s+0.01),L.lat+dy*(s+0.01));if((q[0]-p[0])*(d1[0]-d0[0])+(q[1]-p[1])*(d1[1]-d0[1])<=0)n++;}return n;})()`);
  assert.equal(folds, 0);
  assert.deepEqual(errors, []);
});

test('transit is sold in every Australian data centre and nowhere else, and a network starts in one', () => {
  const { ev, errors } = load();
  const dcs = J(ev, 'CITIES.filter(c=>isDc(c.id)).map(c=>c.id)');
  assert.ok(dcs.length >= 22, `${dcs.length} data centres`);
  for (const c of ['ntl', 'ool', 'mcy', 'tsv', 'lst', 'get']) assert.ok(dcs.includes(c), `${c} is a data centre`);
  assert.deepEqual(J(ev, 'CITIES.filter(c=>isDc(c.id)&&NETS.filter(n=>sellsAt(n,c.id)).length<2).map(c=>c.id)'), [], 'two sellers in each');
  assert.deepEqual(J(ev, 'CITIES.filter(c=>!isDc(c.id)&&NETS.some(n=>sellsAt(n,c.id))).map(c=>c.id)'), [], 'none at POIs, route towns or overseas');
  assert.deepEqual(J(ev, 'Object.keys(CITY).filter(homeOk).sort()'), dcs.slice().sort(), 'every data centre is a starting point, and nothing else');
  // Buying it anyway is refused, overseas and at a POI.
  ev("ACT.start({});S.cash=1e9;for(const c of ['lax','2wol'])ACT.buildPop({city:c});ACT.buyTransit({city:'lax',net:'cog',tier:1});ACT.buyTransit({city:'2wol',net:'tsy',tier:1})");
  assert.equal(ev('S.transit.length'), 0);
  ev("selectCity('lax');UI.tab='up';renderPanel()");
  assert.match(ev("document.getElementById('panelBody').textContent"), /Nobody sells you transit overseas/);
  ev("selectCity('2wol');UI.tab='up';renderPanel()");
  assert.match(ev("document.getElementById('panelBody').textContent"), /Transit isn't sold at a POI/);
  assert.doesNotMatch(ev("document.getElementById('panel').textContent"), /Transit .*× pricier/, 'no transit price where none is sold');
  assert.deepEqual(errors, []);
});

test('a POI has no exchange or fabric ports, and pulls its transit from a data centre, through other POIs if need be', () => {
  const { ev, errors } = load();
  ev("ACT.start({});S.cash=1e9;S.lvl=6;ACT.buyTransit({city:'syd',net:'tsy',tier:1})");
  ev("for(const c of ['2prt','2wol'])ACT.buildPop({city:c});ACT.foundIx({city:'2prt'})");
  assert.equal(ev("!!S.myIx['2prt']"), false, 'no exchange of your own at a POI');
  ev("selectCity('2prt');UI.tab='peer';renderPanel()");
  assert.match(ev("document.getElementById('panelBody').textContent"), /This isn't a data centre/);
  ev("S.nni=[{city:'syd',prov:'mgp',tier:0}];ACT.buyVxc({a:'syd',b:'2prt',prov:'mgp',t:0})");
  assert.equal(ev("S.links.some(l=>l.kind==='vxc')"), false, 'no fabric circuit to a POI');
  // Daisy chain: Sydney → Wollongong (POI) → Penrith (POI); Penrith's homes get out through both.
  const L = (a, b) => ev(`UI.via='land';UI.lmode='wave';openLinkModal('${a}','${b}');ACT.buildLink({tier:1});closeModal()`);
  L('syd', '2wol'); L('2wol', '2prt');
  ev("ACT.nniOrder({city:'2prt',t:0});S.poi['2prt'].ready=0;ACT.launchBB({city:'2prt'});S.pops['2prt'].bb.d=5;compute()");
  assert.equal(ev("pathExists('syd','2prt')&&!S.links.some(l=>[l.a,l.b].includes('syd')&&[l.a,l.b].includes('2prt'))"), true, 'no direct link');
  assert.ok(ev("R.citySrv['2prt']/R.cityDem['2prt']") > 0.95, 'served through the other POI');
  assert.deepEqual(errors, []);
});

test('Megapork backhauls from the overseas hubs at a premium over the cables; Consolation Connect is gone', () => {
  const { ev, errors } = load();
  assert.deepEqual(J(ev, 'FABS.map(f=>f.id)'), ['mgp']);
  for (const c of ['sin', 'hkg', 'tyo', 'akl', 'lax', 'sjc', 'iad', 'lon', 'mrs']) assert.ok(ev(`FAB.mgp.cities.includes('${c}')`), `Megapork reaches ${c}`);
  // Dearer than a wave on any cable of that route, even at the dearest market mood, for 10G and 100G alike.
  const rows = J(ev, `(()=>{const o=[];for(const [a,b] of [['per','sin'],['syd','akl'],['sin','hkg'],['hkg','tyo'],['tyo','sjc'],['lon','iad'],['akl','hnl']]){const km=kmBetween(a,b);
    for(const c of cablesFor(a,b)){const wave=t=>Math.round(waveMo(c.km,true,t)*CAB[c.cid].price*AU_WAVE.sub*1.15);o.push([a,b,c.cid,vxcMo(km,true,0),wave(0),vxcMo(km,true,2),wave(1)]);}}return o;})()`);
  assert.ok(rows.length >= 6);
  for (const [a, b, cid, v10, w10, v100, w100] of rows) {
    assert.ok(v10 > w10, `${a}–${b}: 10G over Megapork ${v10} against ${w10} on ${cid}`);
    assert.ok(v100 > w100, `${a}–${b}: 100G over Megapork ${v100} against ${w100} on ${cid}`);
  }
  // Overland it stays cheap.
  assert.ok(ev("vxcMo(kmBetween('syd','mel'),false,0)") < ev("waveMo(kmBetween('syd','mel'),false,0)"));
  assert.deepEqual(errors, []);
});

test('regional data centres have no homes of their own: broadband comes in at the POIs', () => {
  const { ev, errors } = load();
  ev("ACT.start({});S.cash=1e9;ACT.buildPop({city:'ntl'});ACT.launchBB({city:'ntl'})");
  assert.equal(ev("S.pops.ntl.bb"), null);
  ev("selectCity('ntl');UI.tab='cust';renderPanel()");
  const p = ev("document.getElementById('panelBody').textContent");
  assert.match(p, /they reach you through the nearby NBN POIs/);
  assert.match(p, /Data centre/, 'racks to rent instead');
  assert.deepEqual(errors, []);
});

test('the overseas PoPs are peering only: no broadband there, in the game or in saves', () => {
  const { ev, errors } = load();
  ev("ACT.start({});S.cash=1e9;for(const c of ['lax','tyo'])ACT.buildPop({city:c});ACT.launchBB({city:'lax'});ACT.launchBB({city:'tyo'})");
  assert.equal(ev("S.pops.lax.bb===null&&S.pops.tyo.bb===null"), true, 'refused');
  ev("selectCity('lax');UI.tab='cust';renderPanel()");
  const p = ev("document.getElementById('panel').textContent");
  assert.match(p, /Peering only: you don't sell broadband overseas/);
  assert.doesNotMatch(p, /Gbps of eyeballs/, 'no home market shown');
  // An old save with broadband overseas loses it on load.
  ev("S.pops.lax.bb={d:50};S=migrate(JSON.parse(JSON.stringify(S)));compute()");
  assert.equal(ev('S.pops.lax.bb'), null);
  assert.equal(ev("R.cityEye.lax||0"), 0);
  assert.deepEqual(errors, []);
});

test('no business customers overseas: offers, deals and broker sales stay in Australia', () => {
  const { ev, errors } = load();
  ev("ACT.start({});S.cash=1e9;S.lvl=6;for(const c of ['mel','bne','per','lax','tyo','sin','akl'])ACT.buildPop({city:c});compute()");
  // Every kind of offer, a few thousand times, with PoPs overseas to tempt it.
  const bad = J(ev, "(()=>{const o=[];for(let i=0;i<3000;i++){S.offers=[];spawnOffer();S.offers=S.offers.filter(custOk);for(const x of S.offers)if(!custOk(x))o.push(x.type);}return o;})()");
  assert.deepEqual(bad, []);
  const raw = J(ev, "(()=>{const o=[];for(let i=0;i<3000;i++){S.offers=[];spawnOffer();for(const x of S.offers)if(!custOk(x))o.push(x.type+':'+x.city+'-'+x.city2);}return o;})()");
  assert.deepEqual(raw, [], 'not even before the filter');
  assert.equal(ev("Object.values(CAP_ROUTES).flat().every(r=>custAt(r[0])&&custAt(r[1]))"), true, 'capacity deals at home');
  // One slipped in anyway (an old save, a stale offer): it cannot be signed, and a save drops it.
  ev("S.offers=[{id:'x',city:'syd',city2:'lax',name:'Overseas Co',type:'l2vpn',bw:10,rate:1000,reqs:[],exp:S.day+30}];ACT.accept({id:'x'})");
  assert.equal(ev("S.biz.some(b=>b.id==='x')"), false, 'refused');
  ev("S.biz.push({id:'y',city:'tyo',city2:null,name:'Tokyo Co',type:'dia',bw:10,rate:1000,reqs:[],mood:100,since:0});S=migrate(JSON.parse(JSON.stringify(S)))");
  assert.equal(ev("S.biz.some(b=>b.id==='y')||S.offers.some(o=>o.id==='x')"), false, 'dropped on load');
  // The broker does not sell capacity on a link to an overseas PoP.
  ev("S.links.push({id:'os',a:'per',b:'sin',kind:'df',own:true,sub:true,sys:'roadm',ch:[],km:4373,ready:0,day:0,cut:0,mo:1});ACT.listFiber({id:'os',w:1,p:1})");
  assert.equal(ev("!!S.links.find(l=>l.id==='os').list"), false);
  assert.deepEqual(errors, []);
});
