// Few networks in the building means few transit sellers to haggle with: up to 1.8× where almost nobody is present.
const txComp=c=>{const q=CITY_PDB[c];return q?clamp((1000/Math.max(q[1],10))**0.15,1,1.8):1;};
// No neutral data center means building your own room: POPs cost more to build and to run.
const colo=c=>{const q=CITY_PDB[c];return !q?1:q[0]===0?1.5:q[0]<=2?1.25:1;};
const popMo=c=>Math.round(POP_MO*colo(c));
// Transit is priced off the east coast (AU_TRANSIT): thinner markets further away pay a little more.
const TX_REG={nsw:1,vic:1,act:1.05,qld:1.1,sa:1.15,wa:1.15,tas:1.3,nt:1.5};
function regionMult(c){const C=CITY[c];if(!C)return 1;if(C.gw)return 1;return Math.round(AU_TRANSIT*(TX_REG[C.reg]||1)*txComp(c)*10)/10;}
// What a home pays, against the usual bill.
const arpuOf=c=>CITY[c].arpu||1;
// A network's own markup on top of that, where it is far from home.
const netMult=(n,c)=>regionMult(c)*((n&&n.far&&CITY[c]&&n.far[CITY[c].reg])||1);
// WA to the east: the sea route round the south coast is domestic (AU_WAVE.ew), and the Nullarbor fiber costs more
// because the incumbents own it. The same goes for the Top End: one carrier's glass up the middle to Darwin.
const auPair=(a,b)=>CITY[a].cc==='AU'&&CITY[b].cc==='AU';
const NULLARBOR=1.7,nullPair=(a,b)=>auPair(a,b)&&(CITY[a].reg==='wa')!==(CITY[b].reg==='wa');
const OUTBACK=1.4,outPair=(a,b)=>auPair(a,b)&&(CITY[a].reg==='nt')!==(CITY[b].reg==='nt');
function landMult(a,b){if(isSub(a,b))return 1;return (nullPair(a,b)?NULLARBOR:1)*(outPair(a,b)?OUTBACK:1);}
function landWhy(a,b){if(isSub(a,b))return '';const r=[];if(nullPair(a,b))r.push(tr('geography_and_latency.this_route_crosses_the_nullarbor_x',{x:NULLARBOR}));if(outPair(a,b))r.push(tr('geography_and_latency.this_route_crosses_the_outback_x',{x:OUTBACK}));return r.join(' ');}
function linkLat(l){const f=l.kind==='df'?(l.own?(l.sub?seaLatencyFactor(l):1.1):1.25):l.kind==='vxc'?1.4:l.cable?(CAB[l.cable].lat||1):1.3;return l.km*f/200;}
/* Waves in Australia cost about twice what they do in Europe (few long-haul carriers, long distances): overland at
   AU_WAVE.land, a domestic subsea wave (Bass Strait, round the south coast) at AU_WAVE.ew, and capacity out of the
   country at AU_WAVE.sub. Each route also gets its own market mood, and new leases get cheaper every year (~8%). */
function waveMarket(a,b,sub){const reg=!sub?AU_WAVE.land:auPair(a,b)?AU_WAVE.ew:AU_WAVE.sub;
  const key=a<b?a+b:b+a,mood=0.85+(hstr(key+'|mood')%31)/100;
  const ero=Math.max(0.55,Math.pow(0.92,Math.floor((S?S.day:0)/360)));
  return {m:reg*mood*ero,reg,mood,ero};}
function marketNote(a,b,sub){const k=waveMarket(a,b,sub),ra=CITY[a].reg,rb=CITY[b].reg;const where=ra===rb?REG[ra]:tr('geography_and_latency.a_to_b',{a:REG[ra],b:REG[rb]});
  const lvl=k.reg<0.9?tr('geography_and_latency.cheap_lots_of_competing_fiber'):k.reg<=1.05?tr('common.about_average'):k.reg<2?tr('geography_and_latency.pricey_fewer_carriers'):tr('geography_and_latency.expensive_scarce_capacity');const since=k.ero<1?tr('geography_and_latency.and_prices_have_fallen_p_since',{p:Math.round((1-k.ero)*100)}):'';
  return k.mood<0.97?tr('geography_and_latency.where_lvl_this_route_is_p',{where,lvl,p:Math.round((1-k.mood)*100),since}):k.mood>1.03?tr('geography_and_latency.where_lvl_this_route_is_p_0196',{where,lvl,p:Math.round((k.mood-1)*100),since}):tr('geography_and_latency.where_lvl_this_route_is_right',{where,lvl,since});}
function waveRoute(a,b,mult){const cabs=cablesOk(a,b),sub=isSub(a,b);let via=UI.via;
  if(!cabs.find(c=>c.cid===via))via=sub?(cabs[0]?cabs[0].cid:null):(via==='land'||!via?'land':'land');
  if(!via)return null;
  if(via==='land')return {via,cabs,cab:null,km:kmBetween(a,b),sub:false,wm:mult*landMult(a,b)*waveMarket(a,b,false).m};
  const c=cabs.find(x=>x.cid===via);return {via,cabs,cab:via,km:c.km,sub:true,wm:CAB[via].price*waveMarket(a,b,true).m};}
function viaSeg(a,b){const cabs=cablesOk(a,b),sub=isSub(a,b);if(!cabs.length)return landMult(a,b)>1?`<p class="note">${landWhy(a,b)}</p>`:'';const wr=waveRoute(a,b,1);
  const opts=(sub?[]:[{v:'land',l:`${tr('common.overland')} <small>${landMult(a,b)>1?landMult(a,b)+'× · ':''}${(kmBetween(a,b)*1.3/200).toFixed(1)} ms</small>`}]).concat(cabs.map(c=>({v:c.cid,l:`${esc(CAB[c.cid].name)} <small>${CAB[c.cid].price}× · ${(c.km*(CAB[c.cid].lat||1)/200).toFixed(1)} ms${CAB[c.cid].age==='old'?' · '+tr('geography_and_latency.old_cuts_often'):''}</small>`})));
  return `<h4 class="sub4">${tr('common.route')}</h4><div class="seg">${opts.map(o=>btn(o.l,'via',{v:o.v},wr&&wr.via===o.v?'pink':'ghost')).join('')}</div>${wr&&wr.cab?`<p class="note">${esc(CAB[wr.cab].blurb)} ${tr('geography_and_latency.all_your_waves_on_one_cable')}</p>`:''}`;}
function bestLat(a,b,f){const ls=S.links.filter(l=>!linkDown(l)&&(!f||f(l)));const dist={[a]:0},done=new Set();for(;;){let u=null,ud=Infinity;for(const k in dist)if(!done.has(k)&&dist[k]<ud){u=k;ud=dist[k];}if(u===null)break;if(u===b)return ud;done.add(u);for(const l of ls){if(l.a!==u&&l.b!==u)continue;const v=l.a===u?l.b:l.a,nd=ud+linkLat(l)+0.05;if(nd<(dist[v]??Infinity))dist[v]=nd;}}return Infinity;}
