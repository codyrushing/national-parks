import * as d3_array from 'd3-array';
import * as d3_request from 'd3-request';
import * as d3_selection from 'd3-selection';
import * as d3_geo from 'd3-geo';
import * as d3_zoom from 'd3-zoom';
import * as topojson from 'topojson-client';
import throttle from 'lodash.throttle';
import { requestJSON } from './utils';
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
    return Promise.all([
      requestJSON('/states.topo.json'),
      requestJSON('/lands.topo.json'),
      requestJSON('/lands-metadata.csv', 'csv')
    ])
    .then(
      ([
        states,
        landsTopoJson,
        landsData
      ]) => {
        this.statesGroup.append('path')
          .attr('class', 'state-borders')
          .attr('fill', 'none')
          .attr('stroke', '#ddd')
          .attr(
            'd',
            this.pathGenerator(topojson.mesh(states, states.objects.states))
          );

        this.landFeatures = topojson.feature(landsTopoJson, landsTopoJson.objects.lands).features;

        this.landsPaths = this.landsGroup
          .selectAll('path');

        // join csv metadata with topojson data
        this.landsData = landsData.map(
          l => {
            const matchingFeature = this.landFeatures.find(f => f.id === `${l.id}_${l.type}`);
            if(!matchingFeature){
              return null;
            }
            return {
              ...matchingFeature,
              properties: {
                ...matchingFeature.properties,
                ...l,
                date_established: new Date(l.date_established)
              }              
            };
          }
        )
        .filter(l => l);

        console.log(this.landsData);

        this.buildDateRangeManager();

      }
    )
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
    this.mapWrapper = this.container
      .append('div')
      .attr('class', 'map-wrapper');

    this.mapContainer = this.mapWrapper
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
  }

  buildDateRangeManager(){
    this.dateContainer = this.mapWrapper
      .insert('div', ':first-child')
      .attr('class', 'date-container');

    this.rangeContainer = this.dateContainer
      .append('div')
      .attr('class', 'range');

    this.dateLabels = [
      this.dateContainer.append('div')
        .attr('class', 'range-label start'),
      this.dateContainer.append('div')
        .attr('class', 'range-label end')
    ];

    this.dateRangeManager = new DateRangeManager({
      container: this.rangeContainer.node(),
      extent: d3_array.extent(this.landsData, d => d.date_established)
    });

    this.dateRangeManager.slider.on(
      'update',
      (values, handleIndex) => {
        values = values.map(v => parseInt(v, 10));
        this.dateLabels[handleIndex].text(values[handleIndex]);
        this.onUpdateDateRange(values);
      }
    );
  }

  getLandIdentifier(land){
    return `${land.id}_${land.type}`;
  }

  findLandByIdentifier(identifier){
    const [id, type] = identifier.split('_');
    return this.landsData.find(l => l.id === id && l.type === type);
  }

  onUpdateDateRange(yearRange){
    const dateRange = [
      new Date(yearRange[0], 0, 1),
      new Date(new Date(yearRange[1]+1, 0, 1) - 1)
    ];

    const activeLands = this.landsData.filter(
      land => land.date_established >= dateRange[0] && land.date_established <= dateRange[1]
    );

    this.landsPath
      .data()
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

  fitToWindow(){

    // this.svg
    //   .attr('width', window.innerWidth)
    //   .attr('height', window.innerWidth / aspectRatio);
  }

};

new ProtectedLandsApp();
