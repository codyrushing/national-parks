const fs = require('fs');
const path = require('path');
const request = require('request-promise');
const cheerio = require('cheerio');
const json2csv = require('json2csv');
const { slugify } = require('../utils');
const topojson = require('topojson-client');
const landsTopoJson = require('../public/lands.topo.json');

const cheerioTransformer = body => cheerio.load(body);
const landsJSON = [];

// const landsTopoJson = fs.readFileSync(path.join(__dirname, '../public/lands.topo.json'));
const mapFeatures = topojson.feature(landsTopoJson, landsTopoJson.objects.lands).features;

// parks
const fetchParks = () => request({
  uri: 'https://en.wikipedia.org/wiki/List_of_national_parks_of_the_United_States',
  transform: cheerioTransformer
})
.then(
  $ => {
    $('#mw-content-text .wikitable').eq(0).find('tr:not(:first-child)').each(
      (i, el) => {
        const columns = $(el).children();
        const name = columns.eq(0).text().replace('*', '');
        const id = slugify(name.replace(/( National Park)$/, ''));
        const detailPageUrl = columns.eq(0).find('a').attr('href');
        const date_established = new Date(columns.eq(3).find('span:last-child').text());
        const acreageCell = columns.eq(4);
        acreageCell.children().remove();
        const acreage = parseFloat(acreageCell.text().split(' ')[0].replace(/,/g,''));
        if(mapFeatures.find(f => f.id === `${id}_park`)){
          landsJSON.push({
            name: name.replace(/[ \t]+$/g, ''),
            type: 'park',
            id,
            date_established,
            detail_page_url: `https://en.wikipedia.org${detailPageUrl}`,
            acreage
          });
        }
      }
    );
  }
);

const fetchForests = () => request({
  uri: 'https://en.wikipedia.org/wiki/List_of_U.S._National_Forests',
  transform: cheerioTransformer
})
.then(
  $ => {
    $('#mw-content-text .wikitable').eq(0).find('tr:not(:first-child)').each(
      (i, el) => {
        const columns = $(el).children();
        const nameCell = columns.eq(0).find('a').eq(0);
        const name = nameCell.text().replace('*', '');
        const id = slugify(name);
        const detailPageUrl = columns.eq(0).find('a').attr('href');
        const date_established = new Date(columns.eq(3).find('span:last-child').text());
        const acreageCell = columns.eq(4);
        acreageCell.children().remove();
        const acreage = parseFloat(acreageCell.text().split(' ')[0].replace(/,/g,''));
        if(mapFeatures.find(f => f.id === `${id}_forest`)){
          landsJSON.push({
            name: name.replace(/[ \t]+$/g, ''),
            type: 'forest',
            id,
            date_established,
            detail_page_url: `https://en.wikipedia.org${detailPageUrl}`,
            acreage
          });
        }
      }
    );
  }
);


const fetchMonuments = () => request({
  uri: 'https://en.wikipedia.org/wiki/List_of_National_Monuments_of_the_United_States',
  transform: cheerioTransformer
})
.then(
  $ => {
    var monumentPromises = [];
    $('#mw-content-text .wikitable').eq(1).find('tr:not(:first-child)').each(
      (i, el) => {
        monumentPromises.push(
          new Promise(
            resolve => {
              const columns = $(el).children();
              const nameCell = columns.eq(0);
              const name = nameCell.text();
              const id = slugify(name);
              const date_established = new Date(columns.eq(4).find('span:last-child').text());
              const detailPageUrlText = nameCell.find('a').attr('href');
              const detail_page_url = detailPageUrlText ? `https://en.wikipedia.org${detailPageUrlText}` : null;
              const monument = {
                name,
                id,
                type: 'monument',
                date_established,
                detail_page_url
              };
              if(!mapFeatures.find(f => f.id === `${id}_monument`)){
                return resolve(null);
              }
              if(detail_page_url){
                return request({
                  uri: detail_page_url,
                  transform: cheerioTransformer
                })
                .then(
                  $ => {
                    const acreageHeader = $('#mw-content-text .infobox th:contains(Area)');
                    if(acreageHeader.length){
                      const acreageCell = acreageHeader.last().next();
                      acreageCell.children().remove();
                      const acreage = parseFloat(acreageCell.text().split(' ')[0].replace(/,/g,''));
                      if(!isNaN(acreage)){
                        monument.acreage = acreage;
                      }
                    }
                    resolve(monument);
                  }
                );
              }
              return resolve(monument);
            }
          )
          .then(
            monument => {
              if(monument){
                landsJSON.push({
                  acreage: 0,
                  ...monument
                });
              }
            }
          )
        );
      }
    );
    return Promise.all(monumentPromises);
  }
);



fetchParks()
  .then(fetchMonuments)
  .then(fetchForests)
  .then(
    () => fs.writeFileSync(
      path.join(__dirname, '../public/lands-metadata.csv'),
      json2csv({data: landsJSON, fields: Object.keys(landsJSON[0])}),
      'utf-8'
    )
  );
// fetchForests()
//   .catch(console.error);
