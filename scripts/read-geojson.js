const fs = require('fs');
const path = require('path')
const reader = fs.createReadStream(path.resolve(__dirname, '../data/nps_boundary_clean.json'), { encoding: 'utf-8' });

var count = 0;
reader.on(
  'data',
  data => {
    if(count < 3){
      console.log(data);
    }
    count++;
  }
);
reader.on('error', console.error);
