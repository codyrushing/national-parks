import * as d3_request from 'd3-request';
import * as d3_selection from 'd3-selection';
import * as d3_geo from 'd3-geo';
import * as d3_zoom from 'd3-zoom';
import * as topojson from 'topojson-client';
import throttle from 'lodash.throttle';
import DateRangeManager from './date-range-manager';

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
    // states topojson data
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

    // lands topojson geodata
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
          )
          .on(
            'click',
            d => {
              console.log(d.id);
            }
          );

      }
    );

    // lands metadata
    // d3_request.json(
    //   `${host}/lands.json`
    // )
  }

  ready(){
    this.container = d3_selection.select('#public-lands-app');
    this.buildMapSkeleton();
    this.buildPanel();
  }

  buildMapSkeleton(){
    this.zoom = d3_zoom.zoom()
        .scaleExtent([1, 8])
        .translateExtent([
          [0, 0],
          [mapWidth, mapHeight]
        ])
        .on(
          'zoom',
          () => {
            const {x, y, k} = d3_selection.event.transform;
            const tx = Math.min(0, Math.max(x, mapWidth - mapWidth*k));
            const ty = Math.min(0, Math.max(y, mapHeight - mapHeight*k));
            this.g.attr(
              'transform',
              `translate(${tx},${ty})scale(${k})`
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
      .call(this.zoom)
      // don't zoom on scroll
      .on('wheel.zoom', null);

    this.statesGroup = this.g
      .append('g')
      .attr('class', 'states');

    this.landsGroup = this.g
      .append('g')
      .attr('class', 'lands');

    // zoom buttons
    this.buttonContainer = this.mapContainer
      .append('div')
      .attr('class', 'buttons-container');

    this.zoomOutButton = this.buttonContainer
      .append('button')
      .attr('class', 'zoom-out')
      .on('click', () => this.programmaticZoom(false));

    this.zoomInButton = this.buttonContainer
      .append('button')
      .attr('class', 'zoom-in')
      .on('click', () => this.programmaticZoom(true));
  }

  programmaticZoom(zoomIn=true){
    const { k } = d3_zoom.zoomTransform(this.svg.node());
    this.zoom.scaleTo(this.svg.transition(250), k + (zoomIn ? 1 : -1));
  }

  buildPanel(){
    // detail panel
    this.detailPanel = this.container
      .append('div')
      .attr('class', 'lands-panel');

    this.buildDateRangeManager();
  }

  buildDateRangeManager(){
    this.rangeContainer = this.detailPanel
      .append('div')
      .attr('class', 'range');

    this.dateRangeManager = new DateRangeManager({
      container: this.rangeContainer.node()
    });
  }

  fitToWindow(){

    // this.svg
    //   .attr('width', window.innerWidth)
    //   .attr('height', window.innerWidth / aspectRatio);
  }

};

new ProtectedLandsApp();
