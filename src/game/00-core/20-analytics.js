/* ================= VERSION, RELEASE NOTES AND THE VISIT COUNTER ================= */
const APP_VERSION='__VERSION__';
// Filled in by scripts/build.sh from CHANGELOG.md for this version.
const RELEASE_NOTES=/*__RELEASE_NOTES__*/[];
// A big release's story, shown in full in "What's new" (paragraphs; **bold** allowed). Empty for most releases.
const RELEASE_STORY=/*__RELEASE_STORY__*/[];
const IS_DEV=APP_VERSION.startsWith('__');
// Where the game lives, for share lines and the share card.
const SITE_HOST='seriesoftubes.au';
/* Visits by country, and nothing else: one request to GoatCounter when the page opens. No script of theirs, no
   cookies, no page title, referrer or screen size; GoatCounter reads the country from the request and keeps no IP.
   Only from the real site: previews, localhost, tests and the Claude viewer stay silent. */
const COUNTER='https://thesysadmin.goatcounter.com/count';
(function(){
  try{
    if(IS_DEV||window.__TUBES_TEST__||location.hostname.replace(/^www\./,'')!==SITE_HOST)return;
    fetch(COUNTER+'?p=%2F&rnd='+Math.random().toString(36).slice(2),{mode:'no-cors',credentials:'omit',cache:'no-store',keepalive:true}).catch(()=>{});
  }catch(e){}
})();
