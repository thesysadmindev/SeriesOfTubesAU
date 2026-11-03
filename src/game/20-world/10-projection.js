/* ================= MAP ================= */
/* Simplified real geography: lon/lat outlines, equirectangular over the whole world, which repeats sideways every W
   (scroll east past California and you are back in Asia). The seam sits in the middle of the Atlantic (LON0), so
   Australia, Asia and the Pacific to the Americas read as one piece. Degrees are squashed sideways to the width they
   have at the middle of Australia (27° S), which keeps the continent the shape and size it always had, with gentle
   "magnifying lenses" over the five big cities, where dozens of NBN points of interconnect sit a few kilometres apart.
   A lens pushes points out by m·d/(1+d²/r²)^1.5: unlike a Gaussian it never folds (for m under about 4.9), so a town
   on the rim cannot overtake the coast beyond it and land in the sea. */
const LON0=-30,LAT0=84,XS=W/360,PX=XS/Math.cos(27*Math.PI/180);
const LENSES=[{lon:151.05,lat:-33.85,r:30,m:4},{lon:145.05,lat:-37.85,r:30,m:4},{lon:153.05,lat:-27.5,r:26,m:3},{lon:115.86,lat:-31.95,r:24,m:3},{lon:138.6,lat:-34.85,r:20,m:2.5}];
function proj0(lon,lat){return [((lon-LON0)%360+360)%360*XS,(LAT0-lat)*PX];}
for(const L of LENSES){const q=proj0(L.lon,L.lat);L.x=q[0];L.y=q[1];}
function proj(lon,lat){const q=proj0(lon,lat);let dx=0,dy=0;for(const L of LENSES){let ex=q[0]-L.x;ex-=W*Math.round(ex/W);const ey=q[1]-L.y,f=L.m*(1+(ex*ex+ey*ey)/(L.r*L.r))**-1.5;dx+=ex*f;dy+=ey*f;}return [q[0]+dx,q[1]+dy];}
function hav(lo1,la1,lo2,la2){const r=Math.PI/180,dLa=(la2-la1)*r,dLo=(lo2-lo1)*r,a=Math.sin(dLa/2)**2+Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dLo/2)**2;return 2*6371*Math.asin(Math.min(1,Math.sqrt(a)));}
