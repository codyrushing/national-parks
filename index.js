const path = require('path');
const port = 3030;
const fs = require('fs');
const matter = require('gray-matter');
const express = require('express');
const app = express();
const handlebars = require('handlebars');
const helpers = require('handlebars-helpers')({
  handlebars: handlebars
});

const VIEWS_PATH = 'src/views';
const exphbs  = require('express-handlebars');
const hbs = exphbs.create({
  helpers,
  extname: '.hbs',
  defaultLayout: 'main',
  viewsDir: VIEWS_PATH,
  layoutsDir: path.join(VIEWS_PATH, '_layouts'),
  partialsDir: path.join(VIEWS_PATH, '_partials')
});

app.enable('view cache');
app.engine('hbs', hbs.engine);
app.set('views', VIEWS_PATH);
app.set('view engine', 'hbs');

// TODO, make this look recursively through subdirs
const pageMetadata = {};
const getPageMetadata = path => {
  if(!pageMetadata[path]){
    pageMetadata[path] = matter.read(path, {delims: ['{{!--', '--}}']}).data;
  }
  return pageMetadata[path];
};

const pages = fs.readdirSync(path.join(__dirname, VIEWS_PATH));
pages.forEach(
  page => {
    if(page.indexOf('_') === 0){
      return;
    }
    const pageName = path.basename(page, '.hbs');
    const route = pageName === 'index' ? '' : pageName;
    app.get(
      `/${route}`,
      (req, res, next) => res.render(pageName, getPageMetadata(path.join(VIEWS_PATH, page)))
    );
  }
);

app.use(express.static(__dirname + '/public'));

app.listen(port, err => {
  if(err) throw err;
  console.log(`Server listening on port ${port}`);
});
