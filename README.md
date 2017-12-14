# national-parks
A viz project chronicling the history of national parks in the US

* There are lots of protected land types.  Parks, wilderness, monuments are what I am going to focus on.  National Preserves are kind of like parks, but they sometimes allow oil and gas exploration so I'm going to exclude them
* Scrape establishment dates and acreage from wikipedia [https://en.wikipedia.org/wiki/List_of_national_parks_of_the_United_States](https://en.wikipedia.org/wiki/List_of_national_parks_of_the_United_States)
[https://en.wikipedia.org/wiki/List_of_National_Monuments_of_the_United_States](https://en.wikipedia.org/wiki/List_of_National_Monuments_of_the_United_States)
* This is the projection to use [https://github.com/d3/d3-geo#geoAlbersUsa](https://github.com/d3/d3-geo#geoAlbersUsa)
* NPS has a developer API, query parks by code via [https://developer.nps.gov/api/v1/parks?parkCode=BIBE](https://developer.nps.gov/api/v1/parks?parkCode=BIBE)

### Strategy
* For every feature in the shapefile, filter for only parks, wilderness, and monuments.
  * get the Name
  * store the parkCode in the geometry, there are duplicate park codes for associated wildernesses and whatnot.
  * scrape the wikipedia pages for establishment dates by name
    * For national monuments list page, follow links to monument detail page and try to find acreage.  If not, no big deal (there's also this, but it's a pdf [https://irma.nps.gov/Stats/FileDownload/107](https://irma.nps.gov/Stats/FileDownload/107))
  * store a separate JSON with establishment dates and acreage by parkCode
