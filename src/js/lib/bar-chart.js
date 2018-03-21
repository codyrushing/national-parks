import * as d3_selection from 'd3-selection';
import * as d3_array from 'd3-array';
import * as d3_scale from 'd3-scale';
import * as d3_axis from 'd3-axis';
import Chart from './chart';
import { generateTickValuesInclusive } from './viz-utils';

export default class DiscreteBarChart extends Chart {
  get defaultParams(){
    return {
      ...super.defaultParams,
      resizable: true,
      barPadding: 0.18,
      showXAxis: true,
      showYAxis: true,
      showValues: false,
      animationDuration: 200,
      tickFormats: {
        x: d => d,
        y: d => d
      },
      y: {
        tickSeparation: 50,
        minTickThreshold: 40
      }
    }
  }
  init(){
    if(typeof this.params.keyAccessor === 'function'){
      this.keyAccessor = this.params.keyAccessor.bind(this);
    }
    if(typeof this.params.valueAccessor === 'function'){
      this.valueAccessor = this.params.valueAccessor.bind(this);
    }
    super.init();
  }
  initDOM(){
    const { margins, chartClass, resizable, showValues, showXAxis, showYAxis} = this.params;
    const { width, height } = this.dimensions;

    this.svg = d3_selection.select(this.container).append('svg')
      .attr('class', ['bar-chart', chartClass].join(' '))
      .attr('transform-origin', '0 0 0');

    this.g = this.svg
      .append('g');

    if(showXAxis){
      this.xAxisGroup = this.g
        .append('g')
        .attr('class', 'axis x');
    }

    if(showYAxis){
      this.yAxisGroup = this.g
        .append('g')
        .attr('class', 'axis y');
    }


    // path group
    // this.allBars = this.g
    //   .append('g')
    //   .attr('class', 'all-bars');


    // base line
    if(showValues){
      this.baseLine = this.g
        .append('line')
        .attr('class', 'baseline');
    }

    if(!resizable){
      this.fitToSize()
    }

  }

  fitToSize(){
    const { margins } = this.params;
    const { width, height } = this.dimensions;

    this.svg.attr('width', width + margins.left + margins.right)
      .attr('height', height + margins.top + margins.bottom);

    this.g
      .attr('transform', `translate(${margins.left}, ${margins.top})`);

    this.x
      .rangeRound([0, width]);

    this.y
      .rangeRound([height, 0]);

    if(this.xAxisGroup){
      this.xAxisGroup
        .attr('transform', `translate(0,${height})`)
        .call(
          this.buildXAxis()
        );

      this.xAxisGroup
        .selectAll('.tick text')
        .attr('dy', '0.71em')
        .attr('transform', `translate(-5, 0) rotate(-37,0,0)`)
        .style('text-anchor', 'end');
    }

    if(this.yAxisGroup){
      this.yAxisGroup
        .call(
          this.buildYAxis()
        );
    }

  }

  initScales(){
    const { barPadding } = this.params;
    const { width, height } = this.dimensions;
    this.x = d3_scale.scaleBand()
      .rangeRound([0, width])
      .padding(barPadding);

    this.y = d3_scale.scaleLinear()
      .rangeRound([height, 0]);
  }

  preTransformData(data){
    return data;
  }

  update(data){
    if(data && data.length) {
      this.data = this.preTransformData(data)
    }

    if(this.data && this.data.length){
      this.draw();
    }
  }

  valueAccessor(d){
    return d;
  }

  keyAccessor(d){
    return d;
  }

  getYPosition(d){
    return this.y(
      Math.max(
        this.valueAccessor(d),
        0
      )
    );
  }

  formatValueLabel(d){
    return this.valueAccessor(d);
  }

  buildXAxis(){
    const { height } = this.dimensions;
    return d3_axis.axisBottom(this.x)
      .tickFormat(this.params.tickFormats.x)
      .tickPadding(10)
      .tickSizeOuter(0)
      .tickSizeInner(-height);
  }

  buildYAxis(){
    const { width } = this.dimensions;
    const { y } = this.params;
    const axis = d3_axis.axisLeft(this.y)
      .tickValues(
        generateTickValuesInclusive.call(
          this,
          {
            scale: this.y,
            tickSeparation: y.tickSeparation,
            minTickThreshold: y.minTickThreshold
          }
        )
      )
      .tickSize(0)
      .tickSizeInner(-width);
    if(typeof this.params.tickFormats.y === 'function'){
      axis
        .tickFormat(this.params.tickFormats.y)
    }
    return axis;
  }

  filterDrawnData(data){
    return data;
  }

  getColor(){

  }

  updateDomain(){
    const { autoDomainX, autoDomainY } = this.params;
    if(autoDomainX){
      this.x.domain(this.data.map(this.keyAccessor));
    }
    if(autoDomainY){
      this.y.domain(
        d3_array.extent(
          this.data.map(this.valueAccessor).concat([0])
        )
      );
    }
  }

  draw(){
    const { resizable, margins, showValues, animationDuration } = this.params;
    const { width, height } = this.dimensions;

    if(!this.data) {
      return;
    }

    if(resizable){
      this.fitToSize();
    }

    this.updateDomain();

    const zero = this.y(0);

    if(this.baseLine){
      this.baseLine
        .attr('x1', 0)
        .attr('x2', width)
        .transition()
        .duration(200)
          .attr('y1', zero)
          .attr('y2', zero);
    }

    this.bars = this.g
      .selectAll('g.bar')
      .data(
        this.filterDrawnData(this.data)
      );

    this.barsEnter = this.bars.enter()
      .append('g')
      .attr('class', 'bar');

    this.barsExit = this.bars
      .exit()
        .remove();

    this.barsEnterUpdate = this.bars
      .merge(this.barsEnter);

    this.barsEnter
        .append('rect')
          .attr('x', 0)
          // every bar starts out at 0, then gets updated
          .attr('y', this.y(0)-1)
          .attr('fill', d => this.getColor(d));

    this.barsEnterUpdate
      .attr('transform', d => `translate(${this.x(this.keyAccessor(d))},0)`)
      .select('rect')
        .attr('width', this.x.bandwidth())
        .transition()
        .duration(animationDuration)
          .attr('y', d => this.getYPosition(d))
          .attr('height', d => {
            const val = this.valueAccessor(d);
            return Math.max(
              Math.abs(
                this.y(val) - this.y(0)
              ),
              1
            );
          });

      if(showValues){
        this.barsEnter
          .append('text')
          .attr('class', 'value')
          .attr('text-anchor', 'middle');

        this.barsEnterUpdate
          .select('text.value')
          .attr('x', this.x.bandwidth()/2)
          .text(d => this.formatValueLabel(d))
          .transition()
          .duration(animationDuration)
          .attr('y', d => this.getYPosition(d))
          .attr('dy', d => {
            return this.valueAccessor(d) >= 0 ? '-0.35em' : '1em';
          })
      }
      if(this.baseLine){
        this.baseLine.raise();
      }
  }
}
