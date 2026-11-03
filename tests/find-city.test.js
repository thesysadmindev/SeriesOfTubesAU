const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

const start = "ACT.start({});S.nextFail=1e9;S.nextEvent=1e9";

test('find a city by its name, without accents, by country or by its exchange (#218)', () => {
  const { ev, errors } = load();
  ev(start);
  const find = q => ev(`findCities(${JSON.stringify(q)}).join()`).split(',');
  assert.equal(find('melb')[0], 'mel', 'the start of a name');
  assert.equal(find('MELBOURNE')[0], 'mel', 'any case');
  assert.equal(find('sydnéy')[0], 'syd', 'accents are folded away');
  assert.equal(find('harbour')[0], '2cof', 'a word inside the name');
  assert.ok(find('australia').includes('syd'), 'the country in English');
  assert.ok(find('japan').includes('tyo'));
  assert.ok(find('Flat-White')[0] === 'mel', 'the exchange');
  assert.ok(find('australia').length <= ev('FIND_N'), 'a short list');
  assert.equal(ev("findCities('zzqqxx').length"), 0);
  // Names first, then countries: "port" finds Port Hedland before cities in some country with "port" in it.
  assert.equal(ev("findCities('port').every((c,i,a)=>i===0||fold(CITY[a[i-1]].name).includes('port')||!fold(CITY[c].name).includes('port'))"), true);
  // An empty box lists your own POPs.
  assert.equal(ev("findCities('').join()"), ev("Object.keys(S.pops).join()"));
  assert.deepEqual(errors, []);
});

test('the search box opens with / or the HUD button, Enter jumps to the first city, Escape closes', () => {
  const { ev, dom, errors } = load();
  const doc = dom.window.document;
  ev(start);
  const key = (k, t) => (t || doc.body).dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true }));
  key('/');
  assert.equal(ev("$('modal').hidden"), false, '/ opens it');
  assert.ok(doc.getElementById('findIn'), 'with a search field');
  const inp = doc.getElementById('findIn');
  inp.value = 'kalgoorlie';
  inp.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.match(doc.getElementById('findList').textContent, /Kalgoorlie/);
  key('Enter', inp);
  assert.equal(ev("$('modal').hidden"), true, 'Enter jumps');
  assert.equal(ev('UI.sel&&UI.sel.id||UI.sel'), 'klg', 'and selects Kalgoorlie');
  assert.equal(ev('cam.x'), ev('CITY.klg.x'), 'with the map on it');
  // The HUD button, then a tap on a result.
  doc.querySelector('#hud .chip.find').click();
  assert.equal(ev("$('modal').hidden"), false);
  const i2 = doc.getElementById('findIn');
  i2.value = 'nowhere at all';
  i2.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.match(doc.getElementById('findList').textContent, /No city matches/);
  key('Escape', i2);
  assert.equal(ev("$('modal').hidden"), true, 'Escape closes');
  ev("ACT.findOpen();ACT.findGo({city:'syd'})");
  assert.equal(ev('cam.x'), ev('CITY.syd.x'));
  ev("ACT.findGo({city:'atlantis'})");
  assert.equal(ev('cam.x'), ev('CITY.syd.x'), 'unknown ids are ignored');
  // Typing / in another text field types a slash.
  ev("ACT.rename()");
  key('/', doc.getElementById('rnIn'));
  assert.equal(ev("!!$('findIn')"), false);
  assert.deepEqual(errors, []);
});

test('in German, a German country name finds the city, and the search works on a phone', () => {
  const { ev, dom, errors } = load({ lang: 'de' });
  ev(start + ";if(ACT.pitchSkip)ACT.pitchSkip();window.innerWidth=360;ACT.findOpen()");
  assert.ok(ev("findCities('australien').includes('syd')"), 'Australien');
  assert.ok(ev("findCities('australia').includes('syd')"), 'and Australia still works');
  assert.match(dom.window.document.getElementById('modalCard').textContent, /Stadt finden/);
  assert.doesNotMatch(dom.window.document.getElementById('modalCard').textContent, /\/ /, 'no keyboard tip on a phone');
  assert.deepEqual(errors, []);
});
