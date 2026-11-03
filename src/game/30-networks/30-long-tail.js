/* The long tail: odd little networks with a sliver of traffic each, on one or two exchanges. */
const TAIL=[
 ['Surf Shop Networks','cdn',['lax'],tr('long_tail.hosting_for_surfboard_shops_closed')],
 ['Hawker Centre Hosting','cdn',['sin'],tr('long_tail.cheap_fast_and_open_late')],
 ['Kangaroo Courier','eye',['syd','mel','bne'],tr('long_tail.packets_hop_sometimes_backwards')],
 ['Hobbit Hole Hosting','cdn',['akl'],tr('long_tail.cosy_racks_under_a_hill_second')],
];
/* Who the long tail buys transit from (#85): small networks almost always buy it from a big carrier where they sit,
   usually the cheapest Tier 1 in town or two of them. One or two of the founding five Tier 1s with a PoP in their home
   cities, picked by name so it never changes; where none sits (Auckland), a carrier there that buys from them. */
const TAIL_UP=['cog','lvl','tly','ntt','tat'];
function tailUp(name,home){const h=hstr(name+'|up'),t1=TAIL_UP.filter(id=>{const n=NETS.find(x=>x.id===id);return home.some(c=>n.pops.includes(c));});
  if(!t1.length)return NETS.filter(n=>n.price&&n.up&&n.up.some(u=>TAIL_UP.includes(u))&&home.some(c=>n.pops.includes(c))).map(n=>n.id).slice(0,1);
  const a=t1[h%t1.length],b=t1[(h>>>8)%t1.length];return t1.length>1&&(h>>>16)%100<50&&b!==a?[a,b]:[a];}
function ixStatic(c){const o=[];if(CITY[c]&&CITY[c].ix)o.push(c);for(const x of XIX)if(x.c===c)o.push(x.id);return o;}
TAIL.forEach(([name,type,home,blurb,sh],i)=>{const h=hstr(name),cand=home.flatMap(ixStatic),ix=[];
  if(cand.length){ix.push(cand[h%cand.length]);if(cand.length>1&&(h>>>8)%100<40){const o=cand[(h>>>12)%cand.length];if(!ix.includes(o))ix.push(o);}}
  const sel=(h>>>4)%10>=8;
  NETS.push({id:'tail'+i,name,asn:200000+(h%190000),type,tail:true,up:tailUp(name,home),pol:sel?'selective':'open',...(sel?{minIx:1+(h>>>16)%3,minPni:6+(h>>>18)%8}:{}),share:sh||+(0.0006+((h>>>20)%15)*0.0001).toFixed(4),col:`hsl(${h%360} 55% 46%)`,pops:home.slice(),ix,blurb});});
