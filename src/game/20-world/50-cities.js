/* The map's nodes (ADR 0004). Data centre hubs (the capitals, which also carry the exchanges and cable landings, and
   regional ones) are where you start and buy transit; a few towns sit on the long fibre routes; the overseas PoPs
   (reg 'int', gw) are where Australian traffic goes to peer (no transit is sold there), and the cable landing stations
   on the way (ls) are only places a PoP has to stand. Data centre names with '#' and a list (dcN) are the real sites. The NBN points of
   interconnect (20-world/45-pois.js) are added below: each serves the homes around it. */
const CITIES=[
 {id:'syd',name:'Sydney',land:'oc',reg:'nsw',cc:'AU',au:true,arpu:AU_ARPU,P:500,ix:'IX Straya',dc:'Next-Door-DC #',dcN:['S1','S2','S3','S6'],dc2:'Equinox #',dc2N:['SY1','SY2','SY3','SY4','SY5','SY6','SY9'],note:tr('cities.the_harbour_the_bridge_and_most')},
 {id:'mel',name:'Melbourne',land:'oc',reg:'vic',cc:'AU',au:true,arpu:AU_ARPU,P:450,ix:'Flat-White-IX',dc:'Next-Door-DC #',dcN:['M1','M2','M3'],dc2:'Equinox #',dc2N:['ME1','ME2','ME4','ME5'],note:tr('cities.four_seasons_in_one_day_and')},
 {id:'bne',name:'Brisbane',land:'oc',reg:'qld',cc:'AU',au:true,arpu:AU_ARPU,P:250,ix:'Bris-Vegas-IX',dc:'Next-Door-DC #',dcN:['B1','B2'],dc2:'Equinox #',dc2N:['BR1'],note:tr('cities.brisvegas_big_sky_a_thunderstorm_at')},
 {id:'per',name:'Perth',land:'oc',reg:'wa',cc:'AU',au:true,arpu:AU_ARPU,P:200,ix:'Beard-IX',ixCheap:0.5,dc:'Next-Door-DC #',dcN:['P1','P2'],dc2:'Equinox #',dc2N:['PE1','PE2','PE3'],note:tr('cities.the_most_isolated_big_city_on')},
 {id:'adl',name:'Adelaide',land:'oc',reg:'sa',cc:'AU',au:true,arpu:AU_ARPU,P:150,ix:'Vineyard-IX',dc:'Next-Door-DC #',dcN:['A1'],dc2:'Equinox #',dc2N:['AE1'],note:tr('cities.twenty_minutes_from_everything')},
 {id:'cbr',capital:true,name:'Canberra',land:'oc',reg:'act',cc:'AU',au:true,arpu:AU_ARPU,P:50,ix:'Capital-IX',dc:'Next-Door-DC #',dcN:['C1'],dc2:'Equinox #',dc2N:['CA1'],note:tr('cities.built_for_the_government_the_data')},
 {id:'drw',name:'Darwin',land:'oc',reg:'nt',cc:'AU',au:true,arpu:AU_ARPU,P:15,ix:'Gator-IX',dc:'Next-Door-DC #',dcN:['D1'],dc2:'Crocodile-proof Landing Station',note:tr('cities.tiny_tropical_and_the_closest')},
 {id:'hba',name:'Hobart',land:'tas',reg:'tas',cc:'AU',au:true,arpu:AU_ARPU,P:25,ix:'Cousin-IX',dc:'Firmest',note:tr('cities.the_bottom_of_the_map_cool')},
 // Regional data centres (some are real edge sites: Port Hedland, Newman, the Sunshine Coast): colocation, transit and hosting, but no homes of their own (those come in at the POIs).
 {id:'ntl',name:'Newcastle',land:'oc',reg:'nsw',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Coal Face DC',note:tr('cities.coal_steel_and_surf_the_hunter_s')},
 {id:'ool',name:'Gold Coast',land:'oc',reg:'qld',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Glitter Strip Racks',note:tr('cities.theme_parks_high_rises_and_an')},
 {id:'mcy',name:'Sunshine Coast',land:'oc',reg:'qld',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Next-Door-DC #',dcN:['SC1'],dc2:'Big Pineapple DC',note:tr('cities.beaches_a_big_pineapple_and_plenty')},
 {id:'gos',name:'Central Coast',land:'oc',reg:'nsw',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Coastie Colo',note:tr('cities.between_sydney_and_newcastle_where_half')},
 {id:'wol',name:'Wollongong',land:'oc',reg:'nsw',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Equinox #',dcN:['SY7'],dc2:'Steel City Shed',note:tr('cities.steel_surf_and_a_university_an')},
 {id:'twb',name:'Toowoomba',land:'oc',reg:'qld',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Garden City Racks',note:tr('cities.a_garden_city_on_top_of')},
 {id:'tsv',name:'Townsville',land:'oc',reg:'qld',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Strand Data Hut',note:tr('cities.north_queensland_s_biggest_city_hot')},
 {id:'bdb',name:'Bundaberg',land:'oc',reg:'qld',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Rum Barrel DC',note:tr('cities.rum_sugar_cane_and_turtles_and')},
 {id:'blt',name:'Ballarat',land:'oc',reg:'vic',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Gold Rush Racks',note:tr('cities.a_gold_rush_city_with_grand')},
 {id:'get',name:'Geraldton',land:'oc',reg:'wa',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Doctor Breeze DC',note:tr('cities.the_wind_never_stops_on_the')},
 {id:'tmw',name:'Tamworth',land:'oc',reg:'nsw',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Golden Guitar DC',note:tr('cities.country_music_capital_the_data_centre')},
 {id:'dbo',name:'Dubbo',land:'oc',reg:'nsw',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Western Plains Rack',note:tr('cities.hub_of_the_western_plains_with')},
 {id:'cfs',name:'Coffs Harbour',land:'oc',reg:'nsw',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Big Banana DC',note:tr('cities.bananas_beaches_and_the_north_coast')},
 {id:'nwm',name:'Newman',land:'oc',reg:'wa',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Next-Door-DC #',dcN:['NE1'],dc2:'Iron Ore Edge Hut',note:tr('cities.an_iron_ore_town_in_the')},
 {id:'phe',name:'Port Hedland',land:'oc',reg:'wa',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Next-Door-DC #',dcN:['PH1'],dc2:'Red Dust Landing Station',note:tr('cities.iron_ore_ships_salt_and_the')},
 {id:'lst',name:'Launceston',land:'tas',reg:'tas',cc:'AU',au:true,arpu:AU_ARPU,P:0,dcOnly:true,ix:'',dc:'Cataract Gorge Colo',note:tr('cities.tasmania_s_second_city_with_a')},
 // Towns on the long-haul fibre routes: a repeater hut, not a data centre (no transit, no start).
 {id:'asp',route:true,name:'Alice Springs',land:'oc',reg:'nt',cc:'AU',au:true,arpu:AU_ARPU,P:4,ix:'',dc:'Red Centre Repeater Hut'},
 {id:'klg',route:true,name:'Kalgoorlie',land:'oc',reg:'wa',cc:'AU',au:true,arpu:AU_ARPU,P:4,ix:'',dc:'Super Pit Shed'},
 // The overseas PoPs: where the content Australians fetch, and the networks worth peering with, are.
 {id:'sin',name:'Singapore',land:'my',reg:'int',gw:true,cc:'SG',P:450,ix:'Lah-IX',dc:'Equinox SG#',dcN:5,note:tr('cities.asia_s_hub_expensive_humid_very')},
 {id:'hkg',name:'Hong Kong',land:'hk',reg:'int',gw:true,cc:'HK',P:300,ix:'Dim-Sum-IX',dc:'Equinox HK#',dcN:5,dc2:'Kowloon Container Rack',note:tr('cities.hong_kong_where_the_cables_of')},
 {id:'tyo',name:'Tokyo',land:'jp',reg:'int',gw:true,cc:'JP',P:900,ix:'JP-Nap-Time',dc:'Equinox TY#',dcN:11,dc2:'Otemachi Overflow',note:tr('cities.the_cables_from_guam_and_australia')},
 {id:'akl',name:'Auckland',land:'nz',reg:'int',gw:true,cc:'NZ',P:250,ix:'Kiwi-IX',dc:'Sheep-cooled Shed',note:tr('cities.far_from_everything_every_packet')},
 {id:'lax',name:'Los Angeles',land:'am',reg:'int',gw:true,cc:'US',P:900,ix:'Any2-Anywhere',dc:'One Wilshire',dc2:'Equinox LA#',dc2N:4,note:tr('cities.pacific_cables_land_nearby_and')},
 {id:'sjc',name:'San Jose',land:'am',reg:'int',gw:true,cc:'US',P:400,ix:'Fog-City-IX',dc:'Equinox SV#',dcN:5,note:tr('cities.silicon_valley_where_the_clouds_and')},
 {id:'kul',name:'Kuala Lumpur',land:'my',reg:'int',gw:true,cc:'MY',P:250,ix:'Mamak-IX',dc:'Next-Door-DC #',dcN:['KL1'],note:tr('cities.malaysia_s_capital_an_hour_up')},
 {id:'iad',name:'Ashburn',land:'am',reg:'int',gw:true,cc:'US',P:900,ix:'Data-Centre-Alley-IX',dc:'Equinox DC#',dcN:15,note:tr('cities.data_centre_alley_more_of_the')},
 {id:'lon',name:'London',land:'gb',reg:'int',gw:true,cc:'GB',P:900,ix:'Mind-the-Gap-IX',dc:'Equinox LD#',dcN:11,note:tr('cities.europe_s_biggest_peering_scene_and')},
 {id:'mrs',name:'Marseille',land:'eu',reg:'int',gw:true,cc:'FR',P:300,ix:'Bouillabaisse-IX',dc:'Equinox MR#',dcN:4,note:tr('cities.where_the_cables_from_asia_and')},
 // Cable landing stations overseas: a cable through them needs a PoP there, but nothing is sold (no exchange, transit or space).
 {id:'cgk',name:'Jakarta',land:'jv',reg:'int',gw:true,ls:true,cc:'ID',P:300,ix:'',dc:'Equinox JK1',note:tr('cities.cables_from_perth_darwin_and')},
 {id:'gum',name:'Guam',land:'gu',reg:'int',gw:true,ls:true,cc:'GU',P:6,ix:'',dc:'Tumon Bay Landing Station',note:tr('cities.a_tiny_island_where_half_the')},
 {id:'hnl',name:'Hawaii',land:'hi',reg:'int',gw:true,ls:true,cc:'US',P:30,ix:'',dc:'Aloha Landing Station',note:tr('cities.halfway_across_the_pacific_the_cables')},
 {id:'mct',name:'Oman',land:'om',reg:'int',gw:true,ls:true,cc:'OM',P:20,ix:'',dc:'Barka Landing Station',note:tr('cities.the_cable_from_perth_comes_ashore')},
 {id:'suv',name:'Fiji',land:'fj',reg:'int',gw:true,ls:true,cc:'FJ',P:8,ix:'',dc:'Suva Landing Station',note:tr('cities.the_southern_cross_cables_stop_here')},
];
// NBN points of interconnect: P (the home market) follows the premises each one serves.
for(const p of POIS)CITIES.push({id:p.id,name:p.name,land:p.reg==='tas'?'tas':'oc',reg:p.reg,cc:'AU',au:true,arpu:AU_ARPU,P:Math.max(1,Math.round(p.prem/4400)),ix:'',dc:'Nearly Broadband POI',poi:{area:p.area,prem:p.prem,fsas:p.fsas},ll:p.ll});
// Display-only nudges for cities that sit on top of each other at map scale; distances still use real lon/lat.
const CITY_NUDGE={
 '0dar':[4,3.5],
 '2civ':[1,-3],
 '2cso':[0.5,1.8],
 '2dal':[2.5,-2],
 '2may':[2,-1.5],
 '2nla':[-2,1.5],
 '2stl':[1.5,-3],
 '3exh':[3,2],
 '3gee':[0.5,1],
 '3haw':[1,1.5],
 '3kew':[-1,-1.5],
 '3mte':[1,0.5],
 '3stk':[-1.5,1],
 '3win':[1.5,-1],
 '4cns':[-1.2,-1],
 '4woo':[3,3],
 '5edw':[-2,1],
 '5stm':[2,-1],
 '7hob':[4,2],
 bdb:[-3,-3],
 blt:[-3,-3],
 bne:[-3,-3],
 cbr:[-4,-3],
 cfs:[-3,-3],
 dbo:[-3,-3],
 drw:[-3,-3],
 get:[-0.5,-4],
 gos:[-3,-3],
 hba:[-2.5,-2.5],
 lst:[-3,-3],
 mcy:[-3,-3],
 mel:[-3,-3],
 ntl:[-3,-3],
 ool:[-3,-3],
 syd:[-3,-4],
 tmw:[-3,-3],
 tsv:[-4,-1.5],
 twb:[-3,-3],
 wol:[-3,-3],
};
for(const c of CITIES){const q=CITY_LL[c.id]||c.ll;delete c.ll;if(q){c.lon=q[0];c.lat=q[1];const pt=proj(q[0],q[1]),n=CITY_NUDGE[c.id]||[0,0];c.x=pt[0]+n[0];c.y=pt[1]+n[1];}}
const CITY=Object.fromEntries(CITIES.map(c=>[c.id,c])),CIDX=Object.fromEntries(CITIES.map((c,i)=>[c.id,i]));
// An overseas cable landing station: you need a PoP there to use a cable through it, and can buy nothing else.
const isLs=c=>!!CITY[c]&&!!CITY[c].ls;
// An Australian data centre: where you start, and where transit is sold (not a POI, a route town or overseas).
const isDc=c=>!!CITY[c]&&!!CITY[c].au&&!CITY[c].poi&&!CITY[c].route;
// Where homes buy broadband from you: not overseas (the PoPs there are for peering only), not a regional data centre.
// A data centre you can buy space, caches and PNIs in: an Australian one or an overseas hub (not a POI, a route town
// or a landing station).
const inDc=c=>!!CITY[c]&&!CITY[c].poi&&!CITY[c].route&&!CITY[c].ls;
const homesAt=c=>!!CITY[c]&&!CITY[c].gw&&!CITY[c].dcOnly;
// Where business customers can be: in Australia. Overseas you only peer, so no customer has an end there.
const custAt=c=>!!CITY[c]&&!CITY[c].gw;
const custOk=o=>!!o&&[o.city,o.city2,...(Array.isArray(o.sites)?o.sites:[])].filter(Boolean).every(custAt);
