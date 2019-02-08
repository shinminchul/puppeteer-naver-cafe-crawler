require('dotenv').config();
const googleMapsClient = require('@google/maps').createClient({
  key: process.env.API_KEY,
});
const geocode = require('util').promisify(googleMapsClient.geocode);

exports.getLatLng = async (address) => {
  try {
    const response = await geocode({ address });
    return response.json.results[0].geometry.location;
  } catch (error) {
    return error.message;
  }
};
