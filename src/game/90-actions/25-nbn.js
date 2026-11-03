// NBN NNI ports at a POI: order one, upgrade it (the old port carries on until the new one is patched in), give it up.
Object.assign(ACT,{
 nniOrder:({city,t})=>{t=+t;if(!isPoi(city)||!S.pops[city]||nniOf(city)||!NNI_T[t])return;if(!spend(NNI_T[t].setup))return;
   (S.poi=S.poi||{})[city]={t,ready:S.day+leadDays(NNI_T[t].lead)};toast(tr('nbn.nni_ordered_ready_in_n_days',{g:NNI_T[t].g,n:S.poi[city].ready-S.day}),'good');after();},
 nniUp:({city})=>{const n=nniOf(city);if(!n||n.t>=NNI_T.length-1||n.ready>S.day)return;const t=n.t+1;if(!spend(NNI_T[t].setup))return;
   S.poi[city]={t,ready:S.day+leadDays(NNI_T[t].lead),was:n.t};after();},
 nniDrop:({city})=>{if(!nniOf(city))return;delete S.poi[city];sfx('click');after();},
});
