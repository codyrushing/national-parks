const readline = require('linebyline');
const fs = require('fs');
const path = require('path');
const { slugify, getColorForLandType } = require('../utils');

const writer = fs.WriteStream( path.join(__dirname, '../data/protected_lands.ndjson') );

const addFeaturesAndWrite = (line, slug, type) => {
  line.id = `${slug}_${type}`;
  line.properties = {
    fill: getColorForLandType(type)
  };
  writer.write(JSON.stringify(line));
  writer.write('\n');
};

// read NPS data
readline( path.join(__dirname, '../data/nps_boundary_albersusa.ndjson'), { maxLineLength: 1024 * 10000} )
  .on(
    'line',
    line => {
      line = JSON.parse(line);
      const type = (function(){
        switch(line.properties.UNIT_TYPE){
          case 'National Park':
            return 'park';
          case 'National Monument':
            return 'monument';
          case 'National Preserve':
            return 'preserve';
          case 'National Seashore':
            return 'seashore';
          case 'National Lakeshore':
            return 'lakeshore';
          default:
            return 'wilderness';
        }
      })();
      const slug = slugify(line.properties.UNIT_NAME);
      addFeaturesAndWrite(line, slug, type);
    }
  )
  .on(
    'error',
    console.error
  );

readline( path.join(__dirname, '../data/fs_boundary_albersusa.ndjson'), { maxLineLength: 1024 * 10000} )
  .on(
    'line',
    line => {
      line = JSON.parse(line);
      const type = 'forest';
      const slug = slugify(line.properties.FORESTNAME.replace(/( National Forests?$)|(National \\w+ Area$)/g, "").split(/,|&|\sand\s/g)[0].replace(/ /g, ""));
      addFeaturesAndWrite(line, slug, type);
    }
  )
