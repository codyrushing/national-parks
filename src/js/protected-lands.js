import * as d3_request from 'd3-request';
import * as d3_selection from 'd3-selection';
import * as d3_geo from 'd3-geo';
import * as topojson from 'topojson-client';
import throttle from 'lodash.throttle';

const host = `${window.location.protocol}//${window.location.host}`;
const mapWidth = 900;
const mapHeight = 500;

class ProtectedLandsApp {
  constructor(){
    this.ready = this.ready.bind(this);
    this.fitToSize = this.fitToSize.bind(this);
    document.addEventListener('DOMContentLoaded', this.ready);
    window.addEventListener('resize', throttle(this.fitToSize, 300));
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
          .attr('stroke', '#fff')
          .attr('stroke-width', 0.1)
          .attr('fill', d => d.properties.fill)
          .attr(
            'd',
            this.pathGenerator
          );

      }
    )
  }

  ready(){
    this.svg = d3_selection.select('#map-container')
      .append('svg')
      .attr('viewBox', `0 0 ${mapWidth} ${mapHeight}`)
      .attr('class', 'protected-lands')
      .style('width', '100%');

    this.statesGroup = this.svg
      .append('g')
      .attr('class', 'states');

    this.landsGroup = this.svg
      .append('g')
      .attr('class', 'lands');

  }

  fitToSize(){
    // this.svg
    //   .attr('width', window.innerWidth)
    //   .attr('height', window.innerWidth / aspectRatio);
  }

};

new ProtectedLandsApp();
