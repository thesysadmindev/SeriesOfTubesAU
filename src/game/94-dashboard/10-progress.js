/* ---------- level progress (#34) ---------- */
const pSrv=g=>({l:tr('common.traffic_served'),v:R.served,max:g,txt:`${fmtG(R.served)} / ${fmtG(g)}`});
const pReach=()=>({l:tr('common.reach'),v:R.reach,max:0.99,txt:`${pct(R.reach)} / 99%`});
const pChk=(l,ok)=>({l,v:ok?1:0,max:1,txt:ok?'✓':'—'});
const pRow=x=>`<div class="kv"><span>${esc(x.l)}</span><b>${esc(x.txt)}</b></div>${x.max?`<div class="bar ${x.v>=x.max?'':'warn'}"><i style="width:${Math.min(100,x.max?x.v/x.max*100:0)}%"></i></div>`:''}`;
function lvlItems(){const lv=S.lvl||1,h=lvHave(),G=(l,v,max,txt)=>({l,v,max,txt}),q=LV_REQ[lv];if(!q)return [];
  const out=[G(tr('common.peak_traffic'),h.pk,q.pk,`${fmtG(h.pk)} / ${fmtG(q.pk)}`),G(tr('common.pops'),h.pops,q.pops,`${h.pops} / ${q.pops}`)];
  for(const [k,l] of [['reg',tr('levels.states_and_territories')],['poi',tr('levels.nbn_pois_with_a_live_nni')],['racks',tr('levels.racks_rented')]]){const v=lvNeed(lv,k);if(v)out.push(G(l,h[k],v,`${h[k]} / ${v}`));}return out;}
// Lost Tier 1 status explains itself where you look for it, not only in a toast you may have missed (#73).
const t1Note=()=>S.won&&!isTier1()?`<p class="why">${tr('progress.not_tier_1_right_now_why',{why:esc(t1Why())})}</p>`:'';
function lvlCard(){const lv=S.lvl||1,nx=LEVELS[lv];
  return `<div class="pcard lv"><div class="eyebrow">${tr('progress.customer_level_lv_of_max',{lv,max:LEVELS.length})}</div><div class="pt">${esc(LEVELS[lv-1].n)}</div><div class="meta"><i>${esc(LEVELS[lv-1].q)}</i></div>${t1Note()}${nx?`<div class="meta">${tr('progress.next_name_unlocks_what',{name:esc(nx.n),what:esc(lc1(nx.unlock))})}</div>${lvlItems().map(pRow).join('')}`:`<div class="meta">${tr('common.every_customer_type_is_unlocked_go')}</div>`}</div>`;}
