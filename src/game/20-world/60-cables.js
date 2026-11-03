const CABLES=[
 {"id":"scx","name":"Southern Cross-ed Fingers","price":1.2,"age":"old","blurb":tr('cables.old_pacific_workhorse_everyone_hopes'),"pairs":[["akl","syd",[[168,-37],[158,-35]]],["syd","suv",[[152,-33.8],[156,-32],[166,-25.5],[177.5,-19]]],["akl","suv",[[175.2,-35.5],[176.5,-27],[178.2,-19]]],["suv","hnl",[[-181.2,-17.5],[-176,-8],[-168,6],[-158.5,19.5]]],["hnl","sjc",[[-150,27],[-135,34],[-123.5,37.2]]]]},
 {"id":"hwk","name":"Hawaiki-wiki","price":0.95,"age":"new","blurb":tr('cables.quick_pacific_crossing_with_a_stop'),"pairs":[["syd","hnl",[[-206,-33.8],[-200,-32],[-185,-25],[-172,0],[-158.5,20.2]]],["akl","hnl",[[-185.1,-36],[-182,-28],[-174,-5],[-158.6,20.4]]],["hnl","sjc",[[-150,27.6],[-135,34.6],[-123.5,37.3]]]]},
 {"id":"indigo","name":"Indi-Go-Down","price":0.9,"age":"new","blurb":tr('cables.singapore_to_sydney_via_perth_on'),"pairs":[["sin","cgk",[[104.5,0.8],[105.6,-2.6],[106.5,-5.6]]],["cgk","per",[[106.3,-5.9],[105.85,-5.9],[105.6,-6.6],[105.5,-7.8],[110,-15],[113,-27],[115,-31.5]]],["per","syd",[[114.25,-34],[117.5,-37],[134.21,-39.13],[149,-39],[151.5,-36.5]]]]},
 {"id":"guam","name":"Guam-bling","price":1.1,"age":"mid","blurb":tr('cables.a_bet_on_a_tiny_island'),"pairs":[["syd","gum",[[153,-32.75],[154.25,-29],[151,-10],[148,-7],[148,4],[145,12.9]]],["gum","tyo",[[144.6,13.8],[143.5,20],[141.5,30],[140.2,34.5]]]]},
 {"id":"avo","name":"Cut Lunch Cable","price":0.9,"age":"new","fragile":true,"blurb":tr('cables.perth_to_singapore_and_jakarta'),"pairs":[["per","sin",[[115,-31.5],[113,-27],[109,-12],[103,-6],[101.5,-3],[104.4,0.6]]]]},
 {"id":"ferry","name":"Ferry Express","price":1.0,"age":"mid","blurb":tr('cables.crosses_bass_strait_faster_than_the'),"pairs":[["mel","hba",[[144.5,-38.5],[145,-39],[148.75,-41],[149,-42.5],[148,-43.25]]]]},
 {"id":"bassline","name":"Bass Line","price":1.1,"age":"mid","blurb":tr('cables.the_second_way_across_bass_strait'),"pairs":[["mel","hba",[[145.6,-38.7],[145.9,-39.6],[146.6,-40.8],[147.1,-41.5]]]]},
 {"id":"smap","name":"SMAP (Somewhere, Maybe Also Perth)","price":0.95,"age":"new","blurb":tr('cables.sydney_melbourne_adelaide_and_perth'),"pairs":[["syd","mel",[[151.5,-36.5],[149,-39],[145.25,-39.25],[144.5,-38.5]]],["mel","adl",[[143.75,-39.25],[141,-39],[138,-35.75]]],["adl","per",[[137,-36],[132.14,-36.22],[115.75,-35.5],[114.25,-34]]]]},
 {"id":"tasman","name":"Tasman Global Excess","price":0.95,"age":"new","blurb":tr('cables.sydney_to_auckland_with_plenty_to'),"pairs":[["akl","syd",[[170,-36],[158,-34.5]]]]},
 {"id":"bifrost","name":"Bi-Frosted","price":0.9,"age":"new","blurb":tr('cables.a_rainbow_bridge_from_singapore_to'),"pairs":[["sin","cgk",[[104.7,0.9],[105.9,-2.8],[106.7,-5.6]]],["cgk","gum",[[107.25,-5.25],[113,-5.25],[116,-4.25],[121,2],[139.42,11.57],[144.2,13.3]]],["gum","lax",[[145.5,14.2],[180,22],[210,30],[235,33.5]]]]},
 {"id":"darwin","name":"Darwin Award Cable","price":1.0,"age":"new","blurb":tr('cables.darwin_to_singapore_via_jakarta'),"pairs":[["drw","cgk",[[125,-11],[117,-10],[115.8,-8.7],[115.5,-7.2],[110,-5.8],[107.2,-5.9]]],["cgk","sin",[[106.3,-5.5],[105.4,-2.5],[104.3,0.9]]]]},
 {"id":"jga","name":"J-G’day-A (Japan–Guam–Aussie)","price":0.9,"age":"new","blurb":tr('cables.brisbane_to_tokyo_with_a_beach'),"pairs":[["bne","gum",[[155,-25],[156,-5],[146,12.8]]],["gum","tyo",[[144.7,13.9],[143.6,20],[141.6,30],[140.3,34.6]]]]},
 {"id":"aag","name":"Asia-America Gateaux","price":1.25,"age":"old","blurb":tr('cables.california_to_hong_kong_via_hawaii'),"pairs":[["lax","hnl",[[-119,33.5],[-140,27],[-157.6,21.6]]],["hnl","gum",[[-158.4,21.5],[-180,19],[-200,16],[-214.4,13.7]]],["gum","hkg",[[140,15],[130,17.5],[122.5,19.8],[117,21.2],[114.4,22.1]]],["hkg","sin",[[114.3,21.9],[113,20],[111,15],[110.5,11],[107,6],[104.6,1.5]]]]},
 {"id":"echo","name":"Echo-Chamber","price":0.85,"age":"new","blurb":tr('cables.california_to_singapore_via_guam'),"pairs":[["sjc","gum",[[-124,36.5],[-150,28],[-180,20],[155,15]]],["gum","sin",[[137.45,12.58],[125,10.25],[123.75,9],[122,9],[108,5],[104.25,1.25]]]]},
 {"id":"scxn","name":"Southern Cross-ed Fingers NEXT","price":0.95,"age":"new","blurb":tr('cables.the_old_workhorse_s_younger_sibling'),"pairs":[["syd","suv",[[152,-33.9],[156,-31.5],[166,-25],[177.8,-18.6]]],["suv","lax",[[-181.2,-17.3],[-178,-15],[-165,-5],[-140,15],[-119,33]]]]},
 {"id":"sushi","name":"Sushi Train","price":0.95,"age":"new","blurb":tr('cables.singapore_to_hong_kong_and_tokyo'),"pairs":[["sin","hkg",[[104.6,1.5],[107,6],[110.5,11],[111,15],[113,20],[114.3,21.9]]],["hkg","tyo",[[114.6,21.8],[118,21.2],[121.3,21.4],[122.8,24],[126,26.5],[130,29.5],[134,32.5],[138.5,34.2],[139.8,35.2]]]]},
 {"id":"spurious","name":"Fast and Spurious","price":0.9,"age":"new","blurb":tr('cables.tokyo_to_california_in_one_long'),"pairs":[["tyo","sjc",[[140.5,35],[150,38],[170,42],[-170,43],[-150,42],[-135,39],[-123.5,37.4]]]]},
 {"id":"oac","name":"Oh-Man Cable","price":1.0,"age":"new","blurb":tr('cables.perth_to_oman_where_europe_s'),"pairs":[["per","mct",[[114.5,-31.5],[100,-20],[80,-5],[66,16],[60.2,22.9],[59,23.7]]]]},
 {"id":"smw3","name":"See-Me-Wee 3","price":1.3,"age":"old","blurb":tr('cables.the_old_way_to_europe_perth'),"pairs":[["per","cgk",[[114,-31],[110,-15],[105.4,-7.6],[105.7,-6.3],[106.1,-5.85]]],["cgk","sin",[[106.2,-5.4],[105.2,-2.4],[104.1,0.95]]],["sin","mct",[[103.4,1.15],[101.5,2.4],[100,4],[98.2,6],[95,6.5],[80.5,5],[73,8],[65,17],[60.3,23],[59,23.8]]],["mct","mrs",[[60.3,22.8],[58,19],[52,14],[45,12.2],[43.4,12.7],[42.5,15],[39.5,20],[37,24],[34.5,27.6],[33.6,27.8],[32.6,29.9],[32.4,31.3],[30,32.5],[25,34],[18,36],[12,37.6],[9,38],[7,41],[5.4,43]]],["mrs","lon",[[5,43],[3,42],[1,40.5],[-0.3,38.3],[-1.5,37.3],[-5.4,35.9],[-6.5,36.6],[-9.5,37],[-9.8,39],[-9.6,43.2],[-6,46],[-5.5,49.3],[-5,50.1]]]]},
 {"id":"pond","name":"Pond Hopper","price":0.9,"age":"new","blurb":tr('cables.london_to_ashburn_across_the_pond'),"pairs":[["lon","iad",[[-5.6,50],[-20,50],[-45,45],[-65,40],[-75.9,36.8]]]]},
];
const CAB=Object.fromEntries(CABLES.map(c=>[c.id,c]));
const CABLE_PAIRS=CABLES.flatMap(c=>c.pairs.map(([a,b,mid])=>{const A=CITY[a],B=CITY[b];const near=(x,ref)=>x+W*Math.round((ref-x)/W);
  // Each waypoint the short way from the one before (the map repeats every W), so a cable is drawn in one piece.
  const mp=[];for(const q of mid){const p=proj(q[0],q[1]);if(mp.length)p[0]=near(p[0],mp[mp.length-1][0]);mp.push(p);}const pts=[[near(A.x,mp[0][0]),A.y]].concat(mp,[[near(B.x,mp[mp.length-1][0]),B.y]]);
  const ll=[[A.lon,A.lat]].concat(mid,[[B.lon,B.lat]]);let L=0;for(let i=1;i<ll.length;i++)L+=hav(ll[i-1][0],ll[i-1][1],ll[i][0],ll[i][1]);
  return {cid:c.id,a,b,pts,km:Math.round(L)};}));
function cablesOk(a,b){const ban=S&&S.ev&&S.ev.landban&&S.ev.landban.until>S.day&&[a,b].includes(S.ev.landban.city);if(ban)return [];return cablesFor(a,b);}
function cablesFor(a,b){return CABLE_PAIRS.filter(c=>(c.a===a&&c.b===b)||(c.a===b&&c.b===a));}
function cablePair(cid,a,b){const c=CABLE_PAIRS.find(x=>x.cid===cid&&((x.a===a&&x.b===b)||(x.a===b&&x.b===a)));if(!c)return null;return c.a===a?c:{...c,pts:c.pts.slice().reverse()};}
const ALLC=CITIES.filter(c=>!c.ixOnly).map(c=>c.id);
/* City density: a small city (P under 60) does not sit within 300 km of a bigger city in the same country, unless it
   is a cable landing or a capital (tests/regions.test.js enforces it). Cities retired by that rule are marked off:
   they stay in the data so old saves keep their POPs there, but new games never see them. */
const cityOn=id=>{const c=CITY[id];return !!c&&(!c.off||!!(S&&(S.pops[id]||S.ixp[id]!==undefined)));};
// The cities customers pick from: on the map and in Australia (none overseas, where you only peer).
const OFFC=ALLC.filter(c=>!CITY[c].off&&!CITY[c].gw);

