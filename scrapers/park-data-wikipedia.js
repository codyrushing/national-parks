const fs = require('fs');
const path = require('path');
const request = require('request-promise');
const cheerio = require('cheerio');
const json2csv = require('json2csv');
const { slugify } = require('../utils');

const cheerioTransformer = body => cheerio.load(body);
const parksJSON = [];
const monumentsJSON = [];
const forestsJSON = [];
const preservesJSON = [];

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
        const detailPageUrl = columns.eq(0).find('a').attr('href');
        const date_established = new Date(columns.eq(3).find('span:last-child').text());
        const acreageCell = columns.eq(4);
        acreageCell.children().remove();
        const acreage = parseFloat(acreageCell.text().split(' ')[0].replace(/,/g,''));
        parksJSON.push({
          name: name.replace(/[ \t]+$/g, ''),
          type: 'park',
          id: slugify(name.replace(/( National Park)$/, '')),
          date_established,
          detail_page_url: `https://en.wikipedia.org${detailPageUrl}`,
          acreage
        })
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
        const name = columns.eq(0).text().replace('*', '');
        const detailPageUrl = columns.eq(0).find('a').attr('href');
        const date_established = new Date(columns.eq(3).find('span:last-child').text());
        const acreageCell = columns.eq(4);
        acreageCell.children().remove();
        const acreage = parseFloat(acreageCell.text().split(' ')[0].replace(/,/g,''));
        forestsJSON.push({
          name: name.replace(/[ \t]+$/g, ''),
          type: 'park',
          id: slugify(name.replace(/( National Park)$/, '')),
          date_established,
          detail_page_url: `https://en.wikipedia.org${detailPageUrl}`,
          acreage
        })
      }
    );
    console.log(forestsJSON);
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
              const date_established = new Date(columns.eq(4).find('span:last-child').text());
              const detailPageUrlText = nameCell.find('a').attr('href');
              const detail_page_url = detailPageUrlText ? `https://en.wikipedia.org${detailPageUrlText}` : null;
              const monument = {
                name,
                id: slugify(name),
                type: 'monument',
                date_established,
                detail_page_url
              };
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
            monument => parksJSON.push({
              acreage: 0,
              ...monument
            })
          )
        );
      }
    );
    return Promise.all(monumentPromises);
  }
);



// fetchParks()
//   .then(fetchMonuments)
//   .then(fetchForests)
//   .then(
//     () => fs.writeFileSync(
//       path.join(__dirname, '../data/parks.json'),
//       JSON.stringify(parksJSON),
//       // json2csv({data: parksJSON, fields: Object.keys(parksJSON[0])}),
//       'utf-8'
//     )
//   )
fetchForests()
  .catch(console.error);
