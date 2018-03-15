import * as d3_array from 'd3-array';
import * as d3_request from 'd3-request';
import * as d3_selection from 'd3-selection';
import * as d3_geo from 'd3-geo';
import * as d3_shape from 'd3-shape';
import * as d3_zoom from 'd3-zoom';
import * as topojson from 'topojson-client';
import throttle from 'lodash.throttle';
import { requestJSON } from './utils';
import AcreageChart from './acreage-chart';
import LandsChart from './lands-chart';
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
    this.arcGenerator = d3_shape.arc();
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
        landsMetaData
      ]) => {
        this.statesGroup.append('path')
          .attr('class', 'state-borders')
          .attr('fill', 'none')
          .attr('stroke', '#ddd')
          .attr(
            'd',
            this.pathGenerator(topojson.mesh(states, states.objects.states))
          );

        const landFeatures = topojson.feature(landsTopoJson, landsTopoJson.objects.lands).features;

        // join csv metadata with topojson data
        this.landsData = landFeatures.map(
          f => {
            const matchingLand = landsMetaData.find(l => `${l.id}_${l.type}` === f.id);
            if(!matchingLand){
              return null;
            }
            return {
              ...f,
              properties: {
                ...f.properties,
                ...matchingLand,
                acreage: parseFloat(matchingLand.acreage),
                date_established: new Date(matchingLand.date_established)
              }
            };
          }
        )
        .filter(l => l);

        this.landTypes = this.landsData.reduce(
          (acc, v) => {

            return acc
          }
        )

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

    // build legend

    this.chartsContainer = this.detailPanel.append('div')
      .attr('class', 'charts-container');

    this.acreageChartContainer = this.chartsContainer.append('div')
      .attr('class', 'acreage-chart-container');

    this.landsChartContainer = this.chartsContainer.append('div')
      .attr('class', 'lands-chart-container');

    const graphParams = {
      showYAxis: false,
      autoDomainY: false
    };
    this.acreageChart = new AcreageChart(
      this.acreageChartContainer.node(),
      graphParams
    );

    this.landsChart = new LandsChart(
      this.landsChartContainer.node(),
      graphParams
    );

  }

  buildDateRangeManager(){
    const dateExtent = d3_array.extent(this.landsData, d => d.properties.date_established);
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
      extent: dateExtent
    });

    this.dateRangeManager.slider.on(
      'update',
      (values, handleIndex) => {
        values = values.map(v => parseInt(v, 10));
        this.dateLabels[handleIndex].text(values[handleIndex]);
        this.onUpdateDateRange(values);
      }
    );

    const durationSeconds = 5;
    const stepDurationSeconds = 0.05;
    const stepCount = Math.round(durationSeconds / stepDurationSeconds);
    const yearRange = dateExtent[1].getFullYear() - dateExtent[0].getFullYear() + 1;
    const stepSize = yearRange / stepCount;
    const autoAdvanceInterval = setInterval(
      () => {
        const currentEndYear = parseInt(this.dateRangeManager.slider.get()[1]);
        const nextEndDate = currentEndYear + stepSize;
        this.dateRangeManager.slider.set([null, Math.round(nextEndDate)]);
        if(
          nextEndDate >= dateExtent[1].getFullYear()
        ){
          clearInterval(autoAdvanceInterval);
        }
      },
      stepDurationSeconds * 1000
    );

    this.rangeContainer.on(
      'click touchstart mousedown',
      () => clearInterval(autoAdvanceInterval)
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
      land => land.properties.date_established >= dateRange[0] && land.properties.date_established <= dateRange[1]
    );

    const activeAcres = activeLands.reduce(
      (acc, v) => acc + v.properties.acreage,
      0
    );

    const activeAcresByType = activeLands.map(l => l.properties).reduce(
      (acc, v) => {
        let matchingGroup = acc.find(item => item.type === v.type);
        if(!matchingGroup){
          matchingGroup = {
            type: v.type,
            acreage: 0
          };
          acc.push(matchingGroup);
        }
        matchingGroup.acreage += v.acreage;
        return acc;
      },
      []
    );

    console.log(activeAcresByType);

    const landsPaths = this.landsGroup
      .selectAll('path')
      .data(
        activeLands,
        d => d.id
      );

    landsPaths
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

      landsPaths
        .exit()
        .remove();

  }

  fitToWindow(){

    // this.svg
    //   .attr('width', window.innerWidth)
    //   .attr('height', window.innerWidth / aspectRatio);
  }

};

new ProtectedLandsApp();
