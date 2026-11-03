/* ================= BUSINESSES ================= */
const BIZ_T={
 dia:{l:tr('common.enterprise_dia'),opts:[1,2,5,10],rate:600},
 game:{l:tr('common.game_servers'),gaming:true,opts:[5,10,20,40],rate:120},
 host:{l:tr('common.hosting'),opts:[10,20,40,80],rate:60},
 colo:{l:tr('hosting.colocation'),opts:[2,5,10],racks:[2,4,8],rk:900,rate:70},
 dedi:{l:tr('hosting.dedicated_servers'),opts:[5,10,20],racks:[1,2,4],rk:2600,srv:true,rate:60,lv:2},
 isp:{l:tr('businesses.downstream_isp_buys_transit'),opts:[100,200,400,800],rate:15,lv:2},
 l2vpn:{l:tr('common.l2vpn_circuit'),opts:[1,10,40,100],rate:0,l2:true,km:1,lv:1},
 fabip:{l:tr('businesses.customer_on_a_fabric_transit_over'),opts:[1,5,10,25],rate:110,nni:true,lv:2},
 fabl2:{l:tr('businesses.fabric_circuit_to_one_of_your'),opts:[1,5,10],rate:0,l2:true,nni:true,km:0.8,lv:2},
 stream:{l:tr('common.streaming_startup'),opts:[50,100,200],rate:80,lv:2},
 edu:{l:tr('common.university_network'),opts:[20,50,100],rate:90,lv:2},
 gpu:{l:tr('businesses.ai_gpu_data_center'),opts:[200,400,800],rate:70,lv:3,names:['Neural Noodles AI','GPUs R Us','Hallucination Labs','Transformers & Sons','Token Burners Inc.','Very Large Language Co.','Prompt Engineering Ltd','DeepThought Farms','Parameter Pastures','Gradient Descent Diner','Attention Is All We Need LLC','Overfit Analytics']},
 onramp:{l:tr('businesses.cloud_on_ramp'),opts:[100,200,400],rate:0,l2:true,km:0.7,lv:3,names:["Amazin' Web Services on-ramp","Microsnoft Azzure on-ramp",'Goggle Cloud on-ramp','AliBubble Cloud on-ramp','Miracle Cloud on-ramp']},
 ai:{l:tr('businesses.ai_training_interconnect'),opts:[400,800,1600],rate:0,l2:true,div:true,km:0.9,lv:4,names:['Skynot Compute','Galaxy Brain Training Run','Megawatt Minds','The Big Model Co.','Infinite Context Corp','Sentient Spreadsheet Inc.']},
 hyper:{l:tr('common.hyperscaler_dci'),opts:[1600,3200,6400],rate:0,l2:true,div:true,km:0.5,lv:4,names:["Amazin' Web Services DCI","Microsnoft Azzure DCI",'Goggle Cloud DCI','Faceplant Infra DCI','AliBubble Cloud DCI']},
 hft:{l:tr('businesses.high_frequency_trading_link'),opts:[1,5,10],rate:0,l2:true,lat:true,km:6,lv:2,names:['Flash Boys Capital','Nanosecond Nancy Trading','Speed of Light Securities','Arbitrage & Sons','Front-Run Fund','Microwave Tower Capital','Tick-Tock Quant','Low Latency Larry LLC']},
 bulk:{l:tr('businesses.bulk_backup_transfer_latency_does'),opts:[100,200,400],rate:0,l2:true,scenic:true,km:0.1,lv:2,names:['Glacier Slow Storage','Tape Backup Tortoise','Scenic Route Archives','Cold Storage Cold Cuts','Sloth Sync','Eventually Consistent Inc.','Snail Mail Data Co.']},
 event:{l:tr('common.event_network'),opts:[100,200,400,800,1600,3200],rate:0,event:true,lv:2,names:['Carnaval Parade','Diwali Streaming Night','The Big Football Final','NANOG 99','Burning Router Festival','Euro-Pop Song Contest','Formula Ping Grand Prix','The Big Game','Olympic Pings','A Pop Megastar Stadium Tour','LAN Party of the Century','The Keynote (One More Thing)','Gamer-Con Expo','Oktoberfest Livestream']},
 sdwan:{l:tr('businesses.sd_wan_for_a_chain'),opts:[1,2,5,10],rate:0,l2:true,sdwan:true,km:0,lv:2,names:['Kebab Kingdom','Pretzel Palace','Burger Router Inc.','Café Latte-ncy','Hardware Hut Stores','Pharma-See Pharmacies','Bank of Tiny Branches','Supermarket Superhighway','Fitness Pings Gyms','Hotel Hops Group','Doughnut Data Diners']},
 wwave:{l:tr('common.wholesale_wave'),opts:[1],rate:0,fiber:true,lv:2,names:['Zay-No Fiber','Loomin’ Technologies','Clown Castle Fiber','G&T (Gin and Transit)','A Hyperscaler Who Shall Not Be Named','Megapork','youNetworks']},
 dfpair:{l:tr('businesses.dark_fiber_pair_lease'),opts:[1],rate:0,fiber:true,lv:3,names:['A Hyperscaler Who Shall Not Be Named','Goggle Fiber Division','Faceplant Infra','Amazin’ Backbone Team','A Very Secretive Trading Firm']},
 scrub:{l:tr('businesses.ddos_protection_dia'),opts:[1,5,10,20],rate:900},
 aiwan:{l:tr('businesses.ai_wan_between_two_ai_factories'),opts:[3200,6400,12800],rate:0,l2:true,div:true,mega:true,km:0.45,lv:4,names:['Fairweather AI WAN','Planet-Scale Superfactory Link','Two Brains One Model Inc.','Distributed Godlike Compute','The Gigawatt Handshake']},
 mtrain:{l:tr('businesses.multi_site_training_run'),opts:[1600,3200,6400],rate:0,l2:true,sdwan:true,mega:true,lv:4,names:['Gem-in-Eye Ultra Training Run','Frontier Model 9000','The Very Big Model','Checkpoint-Free Training Co.','Model Too Big For One Building']},
 ingest:{l:tr('businesses.dataset_ingest_elephant_flow'),opts:[1600,3200,6400],rate:0,event:true,mega:true,lv:3,names:['Scrape-the-Whole-Web Ingest','Checkpoint Sync Storm','Video Dataset Firehose','Every Book Ever (allegedly licensed)','Synthetic Data Tsunami']},
 pairs:{l:tr('businesses.hundreds_of_fiber_pairs'),opts:[1],rate:0,fiber:true,mega:true,lv:4,names:['A Hyperscaler Who Shall Not Be Named','Planet-Scale AI WAN Team','The Fiber-Hungry Giant','Project Very Long Glass']},
 esport:{l:tr('businesses.esports_world_final'),opts:[400,800,1600,3200],rate:0,event:true,lv:5,names:['League of Lag Finals','Counter-Ping Major','Fortnightly World Cup','Dota Two Many Viewers','Rocket Leak Championship','Street Frighter Evo']},
 sov:{l:tr('businesses.sovereign_cloud_region'),opts:[400,800,1600],rate:0,l2:true,div:true,km:0.6,lv:6,names:['Gaia-Ex Sovereign Cloud','Bundeswolke (Very Secure)','Le Cloud Souverain','Datenschutz Deluxe','Your Data Stays Here, Probably','A Cloud With a Flag on It','Data Residency Is a State of Mind']},
 cgame:{l:tr('businesses.cloud_gaming_platform'),gaming:true,opts:[800,1600,3200],rate:45,lv:8,names:['Stadia-ium (Back Again)','GeForce Later','Ping Station Now','Luna-tick Gaming','Shadow of a Doubt Cloud PC','Input Lag Arcade','Bufferbloat Bros. Streaming']},
 metav:{l:tr('common.metaverse_platform'),opts:[1600,3200,6400],rate:35,lv:9,names:['Meh-taverse','Second Second Life','Horizon Worlds Apart','The Oasis (Ready Player Done)','Legs Finally Shipped Inc.','Decentra-landlocked']},
 agi:{l:tr('businesses.agi_lab_allegedly'),opts:[12800,25600],rate:0,l2:true,div:true,mega:true,km:0.4,lv:11,names:['Almost General Intelligence Inc.','Superintelligence Pending','The Lab That Said Two More Years','Paperclip Maximizer Labs','Deep Thought Two','Benevolent Overlord Research']},
 mars:{l:tr('businesses.mars_mission_ground_station'),opts:[100,200,400],rate:0,l2:true,lat:true,km:4,lv:13,names:['Red Planet Relay','Ares Ground Segment','Olympus Mons Uplink','Mars or Bust Mission Control','Interplanetary Ping Society','Light-Minute Logistics','RFC 1149 Avian Carriers (Mars Division)']},
};
const LEVELS=[
 {n:tr('levels.garage_rsp'),q:tr('businesses.your_network_diagram_is_a_photo'),unlock:tr('businesses.enterprises_game_servers_hosting')},
 {n:tr('common.regional_player'),q:tr('businesses.you_now_have_a_change_freeze'),unlock:tr('businesses.downstream_isps_streaming_startups')},
 {n:tr('common.serious_backbone'),q:tr('businesses.it_s_not_dns_there_s'),unlock:tr('businesses.ai_gpu_data_centers_and_cloud')},
 {n:tr('common.big_league'),q:tr('businesses.your_mtu_is_9000_on_every'),unlock:tr('businesses.ai_training_interconnects_and')},
 {n:tr('levels.national_carrier'),q:tr('businesses.your_noc_has_a_chat_channel'),era:1.15,unlock:tr('businesses.esports_world_finals_and_the_4k')},
 {n:tr('levels.coast_to_coast'),q:tr('businesses.you_joined_the_outages_mailing_list'),unlock:tr('businesses.sovereign_cloud_regions_and_a_free')},
 {n:tr('levels.wholesale_carrier'),q:tr('businesses.your_asn_now_shows_up_in'),unlock:tr('businesses.a_free_pni_with_voda_phony')},
 {n:tr('common.packet_empire'),q:tr('businesses.your_maintenance_window_is_2_a'),era:1.15,unlock:tr('businesses.cloud_gaming_platforms_and_the_cloud')},
 {n:tr('levels.every_state_and_territory'),q:tr('levels.somewhere_between_broome_and_byron'),unlock:tr('businesses.metaverse_platforms_it_finally_took')},
 {n:tr('businesses.backbone_of_backbones'),q:tr('businesses.your_routing_table_needs_its_own'),era:1.2,unlock:tr('businesses.the_vr_era_eyeballs_want_20')},
 {n:tr('businesses.internet_weather_system'),q:tr('businesses.when_your_bgp_sneezes_a_small'),unlock:tr('businesses.agi_labs_allegedly_wanting_ai_wans')},
 {n:tr('businesses.too_big_to_route'),q:tr('businesses.your_last_fat_fingered_route_leak'),era:1.25,unlock:tr('businesses.the_ai_agent_era_eyeballs_want')},
 {n:tr('common.the_internet'),q:tr('businesses.people_phone_you_to_ask_if'),unlock:tr('businesses.mars_mission_ground_stations_gear')},
];
for(const [i,L] of LEVELS.entries())Object.defineProperty(L,'req',{get:()=>lvReqTxt(i),enumerable:true});
/* What each level asks for: peak Gbps and POPs, and from some levels on states and territories (reg), NBN POIs with a
   live NNI (poi) and racks rented to hosting customers (racks). Those three carry over to the levels above. */
const LV_REQ=[null,{pk:100,pops:3,poi:1},{pk:300,pops:6,poi:3},{pk:700,pops:10,reg:3,poi:6},{pk:1200,pops:15,reg:4,racks:10},{pk:1800,pops:20,poi:12},{pk:2500,pops:25,reg:5,racks:40},{pk:3300,pops:32,poi:25},{pk:4200,pops:40,reg:8},{pk:5200,pops:50,poi:45,racks:100},{pk:6500,pops:60,poi:60},{pk:8000,pops:70,poi:80,racks:200},{pk:10000,pops:80,poi:121}];
const lvNeed=(i,k)=>Math.max(0,...LV_REQ.slice(1,i+1).map(q=>q[k]||0)),lvReg=i=>lvNeed(i,'reg');
// Where you stand on each: POIs count once their NNI is live; racks are the ones customers rent.
const lvHave=()=>({pk:S.stats.peak||0,pops:Object.keys(S.pops).length,reg:regionsCount(),poi:Object.keys(S.poi||{}).filter(c=>S.pops[c]&&nniG(c)>0).length,racks:S.biz.reduce((a,b)=>a+(b.racks||0),0)});
// The sentence for a level's goal, built from LV_REQ.
const LV_N={reg:n=>trn('levels.n_states_or_territories',n),poi:n=>trn('levels.n_nbn_pois',n),racks:n=>trn('levels.n_racks_rented',n)};
function lvReqTxt(i){const q=LV_REQ[i];if(!q)return tr('common.start_here');const out=[tr('levels.peak_g',{g:fmtG(q.pk)}),trn('save.n_pop',q.pops)];
  for(const k in LV_N){const v=lvNeed(i,k);if(v)out.push(LV_N[k](v));}return out.join(' · ');}
// Open gates (sandbox): every level's unlocks are there from the start.
const lvl=()=>S&&S.rules&&S.rules.gates==='open'?LEVELS.length:(S&&S.lvl)||1;
// Lower-case just the first word for mid-sentence use, so names like Tel-Mess or AGI keep their capitals.
const lc1=t=>/^[A-Z][a-z]/.test(t)?t[0].toLowerCase()+t.slice(1):t;
function custLevel(){const h=lvHave();let lv=1;for(let i=1;i<LV_REQ.length;i++){const q=LV_REQ[i];if(h.pk>=q.pk&&h.pops>=q.pops&&['reg','poi','racks'].every(k=>h[k]>=lvNeed(i,k)))lv=i+1;else break;}return lv;}
// Traffic eras: some levels bring a new reason to watch more video, and every city's eyeballs grow toward more.
const eraMul=()=>LEVELS.slice(0,lvl()).reduce((a,L)=>a*(L.era||1),1);
const eyeP=c=>CITY[c].P*eraMul();
// New broadband starts small, but never above what the town can grow to (St Helena has 4,500 people).
const bbStart=c=>Math.min(eyeP(c),Math.max(8,CITY[c].P*0.03));
const BIZ_N=['Byte-Size Bakery','Hamster Wheel Power Co.','Llama Logistics','Cloud Nine Hosting','Rural Rabbit Broadband','Tiny Telco','Pixel Pirates Games','Moo-Moo Dairy Corp','Snack Overflow','Git Happens Ltd','Kernel Sanders Fried Code','Lag-Free Llamas','404 Bistro','Ping Pong Sports','Null Pointer Pets','Buffer Bloat Boats','Packet Pizza','Latency Lattes','Ctrl-Alt-Deli','Sudo Sandwiches','Cache Me Outside','Hertz So Good Radio','Jitterbug Dance Hall','Bit Barn Hosting','Fiber Optimists','The Daily Ping','Squirrel Mesh Wireless','Spam & Eggs Diner','Router Rooter Plumbing','Kilobyte Kebab','Gigglebit Studios','Uptime Funk Records','Ohm Sweet Ohm','Dial-Up Nostalgia Club','Two-Factor Tacos'];

