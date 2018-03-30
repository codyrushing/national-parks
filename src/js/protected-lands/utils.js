import * as d3_request from 'd3-request';
import constants from '../../../constants';
const host = `${window.location.protocol}//${window.location.host}`;

export const requestJSON = function(url, type='json'){
  return new Promise(
    (resolve, reject) => {
      d3_request[type](
        `${host}${url}`,
        (err, response) => err ? reject(err) : resolve(response)
      );
    }
  );
}

export const getColorForLandType = function(landType){
  return constants.COLORS[landType] || '#000';
}

export const capitalize = function(str){
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}
