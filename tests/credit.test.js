// The card where you pick your home city credits the game this one is built on: Series of Tubes by Frederic Jung.
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

test('the city selection card credits Frederic Jung and links to the original game', () => {
  const { ev, errors } = load();
  ev('showTitle()');
  const h = ev("document.getElementById('modalCard').innerHTML");
  assert.match(h, /id="homeSel"/, 'this is the card where you pick your home city');
  assert.match(h, /<p class="credit">Built on <a href="https:\/\/seriesoftub\.es\/" target="_blank" rel="noopener">Series of Tubes<\/a>, the original game by Frederic Jung\.<\/p>/);
  assert.deepEqual(errors, []);
});

test('the welcome message says APNIC assigned your AS number', () => {
  const { ev, errors } = load();
  ev("UI.pitched=true;document.getElementById('toasts').innerHTML='';beginGame('Down Under','mel',{mode:'normal'})");
  const t = ev("[...document.querySelectorAll('#toasts .toast')].at(-1).innerHTML");
  assert.match(t, /APNIC assigned you AS\d+\. Your first router is humming in Melbourne/);
  assert.doesNotMatch(t, /RIPE|Frederic/, 'the credit sits on the city selection card, not here');
  assert.deepEqual(errors, []);
});
