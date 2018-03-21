import * as d3_format from 'd3-format';
import BarChart from '../lib/bar-chart';

export default class AcreageChart extends BarChart {
  valueAccessor(d){
    return d.acreage;
  }
  keyAccessor(d){
    return d.type;
  }
  formatValueLabel(d){
    const value = this.valueAccessor(d);
    if(value < 1000){
      return value;
    }
    if(value < 1000000){
      return `${Math.round(value/1000)}K`;
    }
    return `${d3_format.format(',.1f')(value/1000000)}M`;
  }
}
