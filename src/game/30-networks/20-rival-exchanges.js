/* Rival exchanges. Big metros rarely have just one IX: challengers undercut the incumbent and
   share many members with it, but not all. The incumbent keeps the city id, challengers are 'city~n'. */
const XIX=[
 {id:'lax~2',c:'lax',name:'Smog-IX',cheap:0.6,take:0.45,blurb:tr('rival_exchanges.you_can_t_see_the_fabric')},
 {id:'sin~2',c:'sin',name:'Kopi-IX',cheap:0.6,take:0.5,blurb:tr('rival_exchanges.strong_sweet_and_cheaper_than_the')},
 {id:'syd~2',c:'syd',name:'At-The-Edge IX',cheap:.7,take:0.5,core:['drz','nfx','ggl','fbk','akm','cfl','amz','msf','bdc','slw','abb','voc','stb','spl','lpt','npt','mag'],blurb:tr('rival_exchanges.the_challenger_to_ix_straya_pops')},
];
const XIXM=Object.fromEntries(XIX.map(x=>[x.id,x]));
