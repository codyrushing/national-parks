import * as d3_selection from 'd3-selection';
import * as d3_shape from 'd3-shape';

const arcGenerator = d3_shape.arc();

export default class BarChart {
  constructor(container, options){
    const { className, width, height } = options;

    this.container = d3_selection.select(container);

    this.svg = this.container.append('svg')
      .attr('class', `bar-chart ${className ? className : ''}`);

    this.g = this.svg.append('g');

    this.yAxisGroup = this.g.append('g')
      .attr('class', 'axis y');

    this.barsGroup = this.g.append('g')
      .attr('class', 'bars');
  }

  initScales(){
    // init scales
    this.x = d3.scaleBand()
      .rangeRound([0, width])
      .padding(0.2);

    this.y = d3.scaleLinear()
      .rangeRound([height, 0]);
  }

  fitToSize()

  update(data){
    if(data){
      this.data = data;
      this.draw();
    }
  }
  draw(){
    if(!this.data || !this.data.length){
      return;
    }

    const arcs = this.arcsGroup
      .data(
        this.layout(this.data)
      );

    // enter
    const arcsEnter = arcs.enter()
      .append('path')
      .attr('fill', d => d.fill);

    // enter/update
    arcsEnter.merge(arcs)
      .attr('d', d => arcGenerator);

    // exit
    arcs.exit().remove();

  }
}
