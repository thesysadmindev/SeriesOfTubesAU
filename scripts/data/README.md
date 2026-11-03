# Map data sources

Inputs for `scripts/build-au-map.js`, which generates the map files under `src/game/20-world/`. Edit these,
never the generated files.

## `accc-pois-2011-02.xls`

The ACCC's *List of revised initial points of interconnect to the National Broadband Network* (February 2011):
121 POIs with state, name, metro/outer metro/regional, approximate premises served (G-NAF addresses) and the
number of fibre serving areas. SHA-256 `6bc12ae7476e7811470f7a7447569a98b707471dff480ca2f3bdb716c882abb2`.
Kept as the source of `nbn-pois.csv`; the generator does not read it.

## `world-coast-50m.json`

The world map's coastline: Natural Earth 1:50m land (public domain), simplified by the world-map game (Series of
Tubes 2.3.0, its `scripts/build-land.mjs`), plus Cebu. The generator draws these rings outside the detailed box
(`BOX`) and the 1:10m rings from `ne10m-land-au.json` inside it.

## `nbn-pois.csv`

The same 121 POIs, one per line, sorted by id: `id,state,name,area,premises,fsas,lon,lat`.

- `id`: a game id in NBN's style, the state's postcode digit and three letters (`2ash`, `5edw`). Not NBN Co's
  official POI codes, which this list does not include.
- `state`, `name`, `area`, `premises`, `fsas`: from the spreadsheet. Queanbeyan is listed under ACT as the
  sheet does: it stands in NSW but mostly serves the ACT. "Tarniet" in the sheet is spelled Tarneit here.
- `lon`, `lat`: the centre of the suburb or town the POI is named after (about 1 km), not the exchange
  building's address, which the ACCC kept confidential.
