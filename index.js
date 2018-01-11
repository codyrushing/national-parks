const path = require('path');
const fs = require('fs');
const yfm = require('yfm');
const yamlFrontMatter = require('yaml-front-matter');
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

// https://github.com/ericf/express-handlebars/issues/179
hbs._compileTemplate = function (template, options) {
    var parsed = yfm(template); //parse yfm
    var compiled = this.handlebars.compile(parsed.content, options); //compile without yfm
    compiled.yfm = parsed.context;
    return compiled;
};

hbs._precompileTemplate = function (template, options) {
    var parsed = yfm(template); //parse yfm
    var compiled = this.handlebars.precompile(parsed.content, options); //compile without yfm
    compiled.yfm = parsed.context;
    return compiled;
};

hbs._renderTemplate = function (template, context, options) {
    // merge yaml front matter into context
    context = {
      ...context,
      ...template.yfm
    };
    return template(context, options);
};


app.enable('view cache');
app.engine('hbs', hbs.engine);
app.set('views', VIEWS_PATH);
app.set('view engine', 'hbs');

// TODO, make this look recursively through subdirs
const pages = fs.readdirSync(path.join(__dirname, VIEWS_PATH));
pages.forEach(
  page => {
    if(page.indexOf('_') === 0){
      return;
    }
    const pageName = path.basename(page, '.hbs');
    const route = pageName === 'index' ? '' : pageName;
    app.get(`/${route}`, (req, res, next) => {
      return res.render(pageName);
    });
  }
);

app.use(express.static(__dirname + '/public'));

app.listen(3000);
