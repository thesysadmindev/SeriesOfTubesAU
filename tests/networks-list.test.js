const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

// The list pages at 100 rows (LIST_PAGE); the map has fewer networks than that, so it shows them all with no button.
// Paging itself is covered by the NOC dashboard's long lists (tests/speed.test.js).
test('the Networks list shows 100 networks at a time, with a button for the rest', () => {
  const { ev, errors } = load();
  ev("ACT.start({});if(UI.pendGame)ACT.pitchSkip();UI.left='nets';UI.leftOpen=true;UI.tailOpen=false;ACT.netFilter({f:'all'})");
  const total = ev("NETS.filter(n=>!n.tail).length");
  const rows = () => ev("[...document.querySelectorAll('#left .row .nm .meta')].filter(e=>/^AS\\d/.test(e.textContent)).length");
  assert.equal(rows(), Math.min(total, 100));
  assert.equal(ev("!!document.querySelector('#left [data-act=listMore]')"), total > 100, 'a button for the rest only when there is a rest');
  if (total > 100) {
    ev("document.querySelector('#left [data-act=listMore]').click()");
    assert.equal(rows(), Math.min(total, 200));
  }
  ev("ACT.netFilter({f:'all'})");
  assert.equal(rows(), Math.min(total, 100), 'a new filter starts at the first page again');
  assert.deepEqual(errors, []);
});
