# Series of Tubes: Australia

**Run an Aussie ISP, one tube at a time.** A free cartoon browser game about how
Australian networks really work. Play it at
**[seriesoftubes.au](https://seriesoftubes.au/)**.
(Series of Tubes: Australia is a working title; the final name is still to come.)

You start with one data centre in an Australian capital and grow into a
transit-free Tier 1:

- **The Nearly Broadband Network:** all 121 points of interconnect (POIs), each
  with the premises it serves. Haul your network out to a POI over a leased wave or
  your own dark fibre, rent an NNI port there, and pay an AVC for every home you
  connect. The port's size caps what the area can pull, so growing means upgrading.
- **Hosting:** lease a cage in someone else's data centre or build a hall of your
  own, then rent racks to colocation and dedicated-server customers.
- **Interconnection:** IP transit billed on the 95th percentile, internet exchanges
  with route servers, open/selective/restrictive/paid peering, PNIs with the Big
  Four and the global Tier 1s, embedded CDN caches, and NNI fabrics.
- **Infrastructure:** leased waves across the Nullarbor and up the coasts, Bass
  Strait, subsea cables to the PoPs where Australian traffic goes to peer
  (Singapore, Kuala Lumpur, Hong Kong, Tokyo, Auckland, Los Angeles, San Jose,
  Ashburn, London and Marseille, with the cable landing stations on the way), dark fibre lit
  with DWDM and coherent optics, and router generations that cap your port speeds.
- **Transit is a data centre thing:** you start in one of 24 Australian data
  centres and buy transit there; POIs and the overseas PoPs sell none, and overseas
  you only peer: no homes to sell broadband to, and no business customers.
- **Things break, constantly:** backhoes, cyclones, sharks, fat fingers, route
  leaks, RPKI mishaps and DDoS.

Every company is a pun (Telstraya, Floptus, Hocus Pocus, the Nearly Broadband
Network…). No real company names are used. Places, NBN POI names and conferences
are real.

## Based on Series of Tubes

This is a fork of **[Series of Tubes](https://github.com/fjaeckel/seriesoftubes)** by
Frederic Jung, the world-map original, rebuilt around Australia. Everything
that makes the game fun (the routing engine, the cartoon map and the jokes)
started there.

## Learn how it really works

This game simplifies a lot, and gets some things gloriously wrong on purpose. For
the real thing, go to **[How the Internet Works](https://tkjaer.github.io/how-the-internet-works/)**
by Thomas Kjær Aabo ([source](https://github.com/tkjaer/how-the-internet-works)):
an interactive, zoomable map that follows your data from Wi-Fi and copper to
undersea fiber, with simple or technical explanations.

## Playing locally

It is a single static page, assembled from the files in `src/` by a small Node script:

```sh
npm ci
npm run dev                   # http://localhost:8080
```

Progress is saved in your browser's local storage. Saves from the world-map game
cannot be played on this map: they stay listed so you can export them.

The game speaks English, Italian, Portuguese, French, Spanish and German. It follows
your browser's language the first time and remembers the one you pick under Settings
or on the title screen.

## Development

```sh
npm ci
npm run dev    # development server: assembles src/ on every request, reloads on save
npm test       # headless tests: boot, geography, a year of play, every incident, every panel
npm run build  # writes the site for GitHub Pages to _site/, with version and date stamped in
npm run i18n:check  # lists text missing from (or stale in) the translations
node scripts/build-au-map.js --check  # the coastline and POI files match their inputs
node scripts/og-image.js       # after a build: redraws the link-preview image (needs Chrome)
```

The map's coastline (Natural Earth, public domain) and the 121 POIs (the ACCC's list)
are generated from `scripts/data/` by `scripts/build-au-map.js`; see
[scripts/data/README.md](scripts/data/README.md) for where they come from.

## Contributing

Bugs, ideas and anything else go into a
**[GitHub issue](https://github.com/thesysadmindev/SeriesOfTubesAU/issues/new/choose)**.
Pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). Everyone taking
part follows the [Code of Conduct](CODE_OF_CONDUCT.md): be excellent to each other.

## License

[MIT](LICENSE) © 2026 Frederic Jung (Series of Tubes) and Christopher Hawker (Series of Tubes: Australia)
