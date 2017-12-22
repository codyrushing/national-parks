const readline = require('linebyline');
const parks = require('../data/parks.json');
const fs = require('fs');
const path = require('path');

const writer = fs.WriteStream( path.join(__dirname, '../nps_boundary_joined.ndjson') );
readline( path.join(__dirname, '../nps_boundary_clean.ndjson') ).on(
  'line',
  line => {
    line = JSON.parse(line);
    writer.write()
  }
);
