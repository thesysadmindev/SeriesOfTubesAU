// Data centre space: lease a cage or build a hall (ready after its lead time), or hand back space nobody rents.
Object.assign(ACT,{
 dcLease:({city,t})=>{t=+t;if(!dcCan(city,t))return;if(!spend(DC_T[t].setup))return;((S.dc=S.dc||{})[city]=S.dc[city]||[]).push({t,ready:S.day+leadDays(DC_T[t].lead)});
   toast(tr('hosting.what_ready_in_n_days',{what:tr(DC_T[t].n),n:leadDays(DC_T[t].lead)}),'good');after();},
 dcDrop:({city})=>{if(!S.dc||!S.dc[city]||dcUse(city))return;delete S.dc[city];sfx('click');after();},
});
