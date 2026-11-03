/* Data centre space for colocation and dedicated servers: lease a cage in someone else's building (quick, small), or
   build a hall of your own (slow, big, cheaper per rack). Only off the NBN's POIs, in Australia; a hall needs a big city.
   Customers rent whole racks (BIZ_T rk: per rack a month); dedicated servers are yours, bought when the deal is signed. */
const DC_T=[{n:N_('hosting.cage'),o:N_('hosting.lease_a_cage_offer'),racks:10,setup:30000,mo:6000,lead:14},{n:N_('hosting.data_hall'),o:N_('hosting.build_a_data_hall_offer'),racks:80,setup:400000,mo:25000,lead:120,big:true}],SRV_COST=25000,DC_BIG_P=100;
