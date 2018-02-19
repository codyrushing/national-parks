import * as d3_request from 'd3-request';

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
