#!/bin/bash
PATH=$PATH:./node_modules/.bin

geo2topo -n lands=./data/protected_lands.ndjson \
  | toposimplify -p 0.2 -f \
  | topoquantize 1e4 > public/lands.topo.json
