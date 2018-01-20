#!/bin/bash
PATH=$PATH:./node_modules/.bin

# scrape wikipedia
# node ./scrapers/park-data-wikipedia; ndjson-split < data/parks.json > data/parks.ndjson;
# process the shapefiles to geojson
shp2json ./raw/nps_boundary/nps_boundary.shp -o data/nps_boundary.json;
shp2json ./raw/S_USA.AdministrativeForest/S_USA.AdministrativeForest.shp -o data/forest_boundary.json;
shp2json ./raw/cb_2013_us_state_20m/cb_2013_us_state_20m.shp -o data/states_boundary.json;
# apply projection
geoproject 'd3.geoAlbersUsa()' data/nps_boundary.json > data/nps_boundary_albersusa.json;
geoproject 'd3.geoAlbersUsa()' data/forest_boundary.json > data/fs_boundary_albersusa.json;
geoproject 'd3.geoAlbersUsa()' data/states_boundary.json > data/states_boundary_albersusa.json;
# split into ndjson, filtering out only the desired land types
ndjson-split 'd.features.filter(f => (/^(National Park|National Monument|National Preserve|National Seashore|National Lakeshore)$|(wilderness)/ig).test(f.properties.UNIT_TYPE))' < data/nps_boundary_albersusa.json > data/nps_boundary_albersusa.ndjson;
ndjson-split 'd.features.filter(f => !(/^National Forests/).test(f.properties.FORESTNAME))' < data/fs_boundary_albersusa.json > data/fs_boundary_albersusa.ndjson
# remove unneeded feature data, and add id and colors to be used on front-end, and merge NPS and Forest Service features
node scripts/clean-data.js;
# generate topojson
geo2topo -n lands=./data/protected_lands.ndjson \
  | toposimplify -p 0.2 -f \
  | topoquantize 1e5 > public/lands.topo.json

# geo2svg --stroke "none" -n -o data/protected_lands.svg data/protected_lands.ndjson
