import * d3_axis from 'd3-axis';

export const generateTickValuesInclusive = ({scale, tickSeparation=120, minTickThreshold=60, valueAccessor=v => v}) => {
  const min = scale.domain()[0];
  const max = scale.domain()[1];

  var tickValues = d3_axis.ticks(
    min,
    max,
    Math.abs(
      Math.round(
        (scale(max)-scale(min))/tickSeparation
      )
    )
  );
  tickValues.unshift(min);
  tickValues.push(max);
  tickValues = tickValues.map(valueAccessor);

  // if second value is too close to the first value, drop it
  if(Math.abs(scale(tickValues[1]) - scale(tickValues[0])) < minTickThreshold){
    tickValues.splice(1,1);
  }

  // if second to last point is too close to the end point, drop it
  if(Math.abs(scale(tickValues[tickValues.length-1]) - scale(tickValues[tickValues.length-2])) < minTickThreshold){
    tickValues.splice(tickValues.length-2,1);
  }

  return tickValues;
};
