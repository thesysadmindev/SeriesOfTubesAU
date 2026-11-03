// Data centre space (S.dc[city] = [{t, ready}], one entry per cage or hall) and the racks customers rent in it.
// Space is rented in Australian data centres only: not at a POI or a route town, and not overseas (no customers there).
const dcOk=c=>isDc(c);
const dcCap=c=>((S.dc&&S.dc[c])||[]).reduce((a,u)=>a+(S.day>=u.ready?DC_T[u.t].racks:0),0);
const dcUse=c=>S.biz.reduce((a,b)=>a+(b.city===c&&b.racks?b.racks:0),0);
const dcFree=c=>dcCap(c)-dcUse(c);
const dcMo=()=>Object.values(S.dc||{}).reduce((a,us)=>a+us.reduce((x,u)=>x+DC_T[u.t].mo,0),0);
const hostMo=()=>S.biz.reduce((a,b)=>a+(b.racks&&!capPend(b)?b.racks*BIZ_T[b.type].rk:0),0);
const dcCan=(c,t)=>dcOk(c)&&!!S.pops[c]&&!!DC_T[t]&&(!DC_T[t].big||CITY[c].P>=DC_BIG_P);
// The data centre card in a city panel: space, racks in use, and room to grow.
function dcCard(c){const us=(S.dc&&S.dc[c])||[],cap=dcCap(c),use=dcUse(c);
  let h=`<section class="dcard"><h3>🗄️ ${tr('hosting.data_centre')}</h3>`;
  if(!us.length)h+=`<p class="lead">${tr('hosting.rent_racks_here_to_sell_colocation')}</p>`;
  else{h+=`<div class="kv"><span>${tr('hosting.racks')}</span><b>${tr('city_panel.a_of_b',{a:use,b:cap})}</b></div><div class="bar"><i style="width:${cap?Math.min(100,use/cap*100):0}%"></i></div>`;
    for(const u of us)if(u.ready>S.day)h+=`<p class="note">${tr('hosting.what_ready_in_n_days',{what:tr(DC_T[u.t].n),n:u.ready-S.day})}</p>`;}
  h+=`<div class="btns">${DC_T.map((x,t)=>dcCan(c,t)?btn(tr(x.o,{racks:x.racks,cost:fmt$(x.setup),mo:fmt$(x.mo)}),'dcLease',{city:c,t},us.length||t?'':'pink',S.cash<x.setup):'').join('')}${us.length&&!use?btn(tr('hosting.give_up_the_space'),'dcDrop',{city:c},'ghost sm'):''}</div>`;
  return h+`</section>`;}
