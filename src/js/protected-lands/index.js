import * as d3_request from 'd3-request';
import * as d3_selection from 'd3-selection';
import * as d3_geo from 'd3-geo';
import * as d3_zoom from 'd3-zoom';
import * as topojson from 'topojson-client';
import noUiSlider from 'nouislider'
import throttle from 'lodash.throttle';

const host = `${window.location.protocol}//${window.location.host}`;
const mapWidth = 900;
const mapHeight = 500;

class ProtectedLandsApp {
  constructor(){
    this.ready = this.ready.bind(this);
    this.fitToWindow = this.fitToWindow.bind(this);
    document.addEventListener('DOMContentLoaded', this.ready);
    window.addEventListener('resize', throttle(this.fitToWindow, 300));
    this.pathGenerator = d3_geo.geoPath();
    this.fetch();
  }

  fetch(){
    // request and draw states
    d3_request.json(
      `${host}/states.topo.json`,
      (err, states) => {
        if(err) throw err;

        // this.statesGroup
        //   .selectAll('path')
        //   .data(topojson.feature(states, states.objects.states).features)
        //   .enter()
        //   .append('path')
        //   .attr('fill', 'none')
        //   .attr('stroke', '#ccc')
        //   .attr('d', this.pathGenerator);

        this.statesGroup.append('path')
            .attr('class', 'state-borders')
            .attr('fill', 'none')
            .attr('stroke', '#ddd')
            .attr(
              'd',
              this.pathGenerator(topojson.mesh(states, states.objects.states))
            );
      }
    );

    d3_request.json(
      `${host}/lands.topo.json`,
      (err, lands) => {
        if(err) throw err;
        this.landsGroup
          .selectAll('path')
          .data(topojson.feature(lands, lands.objects.lands).features)
          .enter()
          .append('path')
          .attr('id', d => d.id)
          .attr('fill', d => d.properties.fill)
          .attr(
            'd',
            this.pathGenerator
          );

      }
    )
  }

  ready(){
    this.container = d3_selection.select('#public-lands-app');
    this.buildMapSkeleton();
    this.buildPanel();
  }

  buildMapSkeleton(){
    const zoom = d3_zoom.zoom()
        .scaleExtent([1, 8])
        .on(
          'zoom',
          () => {
            this.g.attr(
              'transform',
              d3_selection.event.transform
            );
          }
        );
    // map container
    this.mapContainer = this.container
      .append('div')
      .attr('class', 'map-container');

    // build SVG
    this.svg = this.mapContainer
      .append('svg')
      .attr('viewBox', `0 0 ${mapWidth} ${mapHeight}`)
      .attr('class', 'protected-lands')
      .style('width', '100%');

    this.g = this.svg.append('g');

    this.svg
      .call(zoom)
      .on('wheel.zoom', null);

    this.statesGroup = this.g
      .append('g')
      .attr('class', 'states');

    this.landsGroup = this.g
      .append('g')
      .attr('class', 'lands');
  }

  buildPanel(){
    // detail panel
    this.detailPanel = this.container
      .append('div')
      .attr('class', 'lands-panel');

    this.rangeContainer = this.detailPanel
      .append('div')
      .attr('class', 'range');

    this.buildRangeSlider();
  }

  buildRangeSlider(){
    if(this.rangeSlider){
      this.rangeSlider.destroy();
    };

    const isLandscape = window.innerWidth / window.innerHeight > 1;

    this.rangeContainer.style('height', isLandscape ? '300px' : null);

    this.rangeSlider = noUiSlider.create(
      this.rangeContainer.node(),
      {
        start: [1895, 1950],
        orientation: isLandscape ? 'vertical' : 'horizontal',
        direction: isLandscape ? 'rtl' : 'ltr',
        connect: true,
        step: 1,
        tooltips: true,
        range: {
          min: 1895,
          max: 2013
        }
      }
    );

  }

  fitToWindow(){
    this.buildRangeSlider();

    // this.svg
    //   .attr('width', window.innerWidth)
    //   .attr('height', window.innerWidth / aspectRatio);
  }

};

new ProtectedLandsApp();
