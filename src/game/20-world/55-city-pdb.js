/* Real-world calibration, pulled 2026-10-25 (Pacific islands 2026-10-26). Per city: [carrier-neutral facilities, network presences across them,
   ASNs registered in its country]. Facilities and presences are PeeringDB facilities within 50 km or in the same city
   (peeringdb.com/api/fac, net_count summed); ASNs per country are from bgp.he.net/report/world.
   Cities PeeringDB barely knows (added 2026-10-28) are marked: est. is an estimate from what is known to be there, with
   the country's ASN count. A city missing here keeps the plain regional price. One entry per line, sorted by id. */
const CITY_PDB={
 adl:[6,70,3196], // est.
 akl:[27,398,755],
 bdb:[1,2,3196], // est.
 blt:[2,3,3196], // est.
 bne:[21,277,3196],
 cbr:[5,60,3196], // est.
 cfs:[1,2,3196], // est.
 dbo:[1,2,3196], // est.
 drw:[3,15,3196],
 get:[1,2,3196], // est.
 gos:[1,2,3196], // est.
 hba:[2,10,3196], // est.
 hkg:[60,2300,1050], // est.
 lax:[44,939,33300],
 lst:[2,4,3196], // est.
 mcy:[1,3,3196], // est.
 mel:[20,395,3196],
 ntl:[2,6,3196], // est.
 ool:[2,5,3196], // est.
 per:[12,248,3196],
 sin:[58,1271,782],
 sjc:[62,1500,33300], // est.
 syd:[40,979,3196],
 tmw:[1,2,3196], // est.
 tsv:[1,4,3196], // est.
 twb:[2,4,3196], // est.
 tyo:[85,2400,1250], // est.
 wol:[1,3,3196], // est.
};
