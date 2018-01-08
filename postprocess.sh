#!/bin/bash
PATH=$PATH:./node_modules/.bin

# remove this
shp2json ./raw/cb_2013_us_state_20m/cb_2013_us_state_20m.shp -o data/states_boundary.json;
geoproject 'd3.geoAlbersUsa()' data/states_boundary.json > data/states_boundary_albersusa.json;

# convert states to topojson for simplification and quantization
geo2topo states=./data/states_boundary_albersusa.json \
  | toposimplify -p 1 -f \
  | topoquantize 1e5 > data/states.topo.json;

# convert topojson back to geo, and then to svg
topo2geo states=data/states.geo.json < data/states.topo.json;
geo2svg -p 1 -w 960 -h 960 < data/states.geo.json > data/states.svg;
