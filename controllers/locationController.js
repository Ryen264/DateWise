import {Locations} from '../models/locationModel.js';
// 
// receive the location data from the database and send it to the client
const getLocations = async (req, res) => {
    try {
        const locations = await Locations.find();
        // console.log(locations[0]);
        // res.status(200).json(locations);
        return locations;
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export { getLocations };