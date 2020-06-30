const axios = require('axios');
const urlWilayah = '/wilayah'
const url = process.env.url_ref+urlWilayah;

getWilayah = async function (code, level) {
  // let options = {
  //   params: {
  //     filter: {
  //       code: code
  //     },
  //     filter: {
  //       level: level
  //     }
  //   }
  // }
  let wilayah = {};
  await axios.get(url + '?filter[code]=' + code + '&filter[level]=' + level).then(wil => {
    wilayah = wil.data.data;
    if(wil.data && wil.data.data && wil.data.data.length > 0)
      wilayah = wil.data.data[0];
  })
  .catch(e => {
    throw e;
  });

  return wilayah;
}

module.exports = {
  getWilayah
}