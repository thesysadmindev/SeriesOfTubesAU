/* NBN Points of Interconnect: a POP at a POI sells broadband only through an NNI port there (S.poi[city] = {t, ready,
   was}: its size, the day it is patched in, and the size it had before an upgrade, which carries on until then). */
const isPoi=c=>!!(CITY[c]&&CITY[c].poi);
const nniOf=c=>(S&&S.poi&&S.poi[c])||null;
// What the homes behind a POI can pull through its NNI: Infinity off the POIs (a hub hands over in your own DC).
const nniG=c=>{if(!isPoi(c))return Infinity;const n=nniOf(c);if(!n)return 0;return S.day>=n.ready?NNI_T[n.t].g:n.was!=null?NNI_T[n.was].g:0;};
const nbnSubs=g=>Math.round(g*NBN_SUBS);
// AVCs for the homes a POP serves: they add up to the wholesale share of what those homes pay.
const avcMo=(c,g)=>g*EYE_RATE*arpuOf(c)*AU_WHOLESALE;
const nbnMo=()=>Object.values(S.poi||{}).reduce((a,n)=>a+NNI_T[n.t].mo,0);
