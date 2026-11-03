// Is there a path of working links between two of your POPs?
function pathExists(a,b){if(!S.pops[a]||!S.pops[b])return false;const adj={};for(const l of S.links){if(linkDown(l))continue;(adj[l.a]=adj[l.a]||[]).push(l.b);(adj[l.b]=adj[l.b]||[]).push(l.a);}const seen=new Set([a]),q=[a];while(q.length){const u=q.shift();if(u===b)return true;for(const v of adj[u]||[])if(!seen.has(v)){seen.add(v);q.push(v);}}return false;}
function beginGame(nm,city,o={}){if(needPitch()&&!UI.pitched){UI.pendGame=[nm,city,o];openModal(pitchHtml(true));return;}slotLeave();slotNew();newGame(nm,city);{const a=+(UI.asnTxt||UI.asnSug||0);if(asnOk(a))S.asn=a;UI.asnSug=null;}S.mode=o.mode||'normal';
  // The rules are picked here and locked for the life of the network.
  {const pr=S.mode==='sandbox'?'sandbox':own(PRESETS,o.preset)&&o.preset!=='sandbox'?o.preset:'oncall';S.rules=makeRules(pr,o.rules);}
  if(S.mode==='sandbox'){S.cash=1e9;S.lvl=LEVELS.length;if(!chaosMul()){S.nextFail=1e9;S.nextEvent=1e9;}}
  // Every new network starts at ½ speed (#186), whatever the last one ran at: slow enough to look around, but things happen.
  UI.speed=UI.lastSpeed=0.5;UI.resumeSpeed=null;
  UI.started=true;closeModal();compute();cam.x=CITY[city].x;cam.y=CITY[city].y;cam.z=innerWidth<760?1.1:1.4;selectCity(city);
  toast(S.mode==='sandbox'?(chaosMul()?tr('scenarios.sandbox_mode_a_billion_dollars_chaos',{chaos:CHAOS[rule('chaos')].n}):tr('scenarios.sandbox_mode_a_billion_dollars_every')):tr('scenarios.welcome_name_apnic_assigned_you',{name:esc(nm),asn:S.asn,city:CITY[city].name}),'goal');
  renderAll();save();if(S.mode!=='sandbox')tutorialStart();}
