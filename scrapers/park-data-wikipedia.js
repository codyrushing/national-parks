const request = require('request-promise');
const cheerio = require('cheerio');

const cheerioTransformer = body => cheerio.load(body);
const parksJSON = [];
const monumentsJSON = [];
request({
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
          name,
          date_established,
          detailPageUrl: `https://en.wikipedia.org${detailPageUrl}`,
          acreage
        })
      }
    );
  }
)
.then(
  () => request({
    uri: 'https://en.wikipedia.org/wiki/List_of_National_Monuments_of_the_United_States',
    transform: cheerioTransformer
  })
)
.then(
  $ => {
    var p;
    $('#mw-content-text .wikitable').eq(1).find('tr:not(:first-child)').each(
      (i, el) => {
        const columns = $(el).children();
        const nameCell = columns.eq(0);
        const name = nameCell.text();
        const detailPageUrl = nameCell.find('a').attr('href');
        if(detailPageUrl){
          const monumentLookup = request({
            uri: `https://en.wikipedia.org${detailPageUrl}`,
            transform: cheerioTransformer
          })
          .then(
            $ => {
              const acreageHeader = $('#mw-content-text .infobox th:contains(Area)');
              if(acreageHeader.length){
                const acreageCell = acreageHeader.eq(0).next();
                acreageCell.children().remove();
                const acreage = parseFloat(acreageCell.text().split(' ')[0].replace(/,/g,''));
                console.log(acreage);
              }
            }
          );

          if(!p){
            p = monumentLookup;
          } else {
            p.then(p);
          }

        }
      }
    );
    return p;
  }
)
.catch(console.error)
