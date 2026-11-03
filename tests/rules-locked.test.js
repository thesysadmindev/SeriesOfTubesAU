// The rules follow from the mode when a save loads: an edited or imported save cannot change them (2.0).
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

test('a loaded save gets the rules of its mode, whatever its rules say', () => {
  const { ev, errors } = load();
  ev("beginGame('T','syd',{mode:'normal'});if(UI.pendGame)ACT.pitchSkip()");
  const base = JSON.parse(ev('JSON.stringify(packSave(S))'));
  const loadAs = (mut) => { const s = JSON.parse(JSON.stringify(base)); mut(s); ev(`S=migrate(JSON.parse(${JSON.stringify(JSON.stringify(s))}))`); return JSON.parse(ev('JSON.stringify(S.rules)')); };
  const preset = (p, o) => JSON.parse(ev(`JSON.stringify(makeRules('${p}'${o ? ',' + JSON.stringify(o) : ''}))`));
  // Normal games keep one of the three Normal presets, with nothing changed.
  for (const p of ['freeze', 'oncall', 'bgp']) assert.deepEqual(loadAs(s => { s.rules = { preset: p }; }), preset(p));
  assert.deepEqual(loadAs(s => { s.rules = { preset: 'oncall', money: 'infinite', gates: 'open', chaos: 'none', lead: 'quick' }; }), preset('oncall'), 'no free money or open gates in On-call');
  assert.deepEqual(loadAs(s => { s.rules = { preset: 'puzzle' }; }), preset('oncall'), 'the old puzzle rules load as On-call');
  assert.deepEqual(loadAs(s => { s.rules = { preset: 'sandbox' }; }), preset('oncall'), 'no sandbox powers without the sandbox tag');
  assert.deepEqual(loadAs(s => { delete s.rules; }), preset('oncall'), 'a save from before 2.0 is On-call');
  // Sandboxes keep only their chaos.
  assert.deepEqual(loadAs(s => { s.mode = 'sandbox'; s.rules = { preset: 'sandbox', chaos: 'spicy', clock: false, money: 'normal' }; }), preset('sandbox', { chaos: 'spicy' }));
  assert.deepEqual(loadAs(s => { s.mode = 'sandbox'; s.rules = { preset: 'bgp' }; }), preset('sandbox'));
  // Scenarios are gone: a scenario save plays on as the Normal game it asks for, without the scenario.
  const scn = { id: 'pac', rules: { spat: true }, days: 1095, name: 'x', mods: [] };
  for (const p of ['bgp', 'oncall', 'freeze'])
    assert.deepEqual(loadAs(s => { s.mode = 'scenario'; s.scn = scn; s.rules = { preset: p }; }), preset(p), p);
  ev(`S=migrate(JSON.parse(${JSON.stringify(JSON.stringify({ ...base, mode: 'scenario', scn, rng: 7 }))}))`);
  assert.deepEqual(JSON.parse(ev("JSON.stringify([S.mode,'scn' in S,'rng' in S])")), ['normal', false, false], 'normal, no scenario, no seed');
  assert.deepEqual(errors, []);
});

test('a save that claims to be a puzzle loads as a Normal On-call game, with days passing', () => {
  const { ev, errors } = load();
  ev("beginGame('T','syd',{mode:'normal'});if(UI.pendGame)ACT.pitchSkip()");
  const s = JSON.parse(ev('JSON.stringify(packSave(S))'));
  s.mode = 'puzzle'; s.rules = { preset: 'puzzle' };
  ev(`S=migrate(JSON.parse(${JSON.stringify(JSON.stringify(s))}));UI.started=true;compute()`);
  assert.equal(ev('S.mode'), 'normal');
  assert.equal(ev('S.pz'), undefined);
  ev('for(let i=0;i<3;i++)dayTick()');
  assert.equal(ev('S.day'), 3, 'days pass');
  ev(`UI.importing=JSON.parse(${JSON.stringify(JSON.stringify(s))});ACT.importGo()`);
  assert.equal(ev('S.mode'), 'normal');
  assert.equal(ev('rulePreset()'), 'oncall');
  assert.deepEqual(errors, []);
});
