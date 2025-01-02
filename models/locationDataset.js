import { MongoClient } from 'mongodb';
import { Locations } from '../models/locationModel.js';
import { Tags } from '../models/planModel.js';
import { AverageSpendingTime } from '../models/planModel.js';

class LocationDataset {
    constructor() {
        this.locationDict = {};
        this.tagDict = {};
        this.avgSpendingTimeDict = {};
        this.data = {};
    }
  
    async initialize() {
  
        const locationList = await Locations.find();
        // console.log(locationList);
        for (const record of locationList) {
            this.locationDict[record._id.toString()] = {
            district: record.district.toString(),
            tag: record.tag.toString(),
            price: parseInt(record.price),
            };
        }
  
        const tagList = await Tags.find();
        for (const record of tagList) {
            this.tagDict[record._id.toString()] = record.TAG_TYPE.toString();
        }
  
        const avgSpendingTimeList = await AverageSpendingTime.find();
        for (const record of avgSpendingTimeList) {
            this.avgSpendingTimeDict[record.TYPE_NAME.toString()] = parseFloat(record.TYPE_AVGHOUR);
        }
  
        for (const [locationId, locationInfo] of Object.entries(this.locationDict)) {
            this.data[locationId] = {
            district: locationInfo.district,
            tag: locationInfo.tag,
            price: locationInfo.price,
            type: this.tagDict[locationInfo.tag],
            avgSpendingTime: this.avgSpendingTimeDict[this.tagDict[locationInfo.tag]],
            };
        }
    }
  
    getDistrict(locationId) {
      return this.data[locationId].district;
    }
  
    getTag(locationId) {
      return this.data[locationId].tag;
    }
  
    getPrice(locationId) {
      return this.data[locationId].price;
    }
  
    getType(locationId) {
      return this.data[locationId].type;
    }
  
    getAvgSpendingTime(locationId) {
      return this.data[locationId].avgSpendingTime;
    }
  
    getLocations() {
      return Object.keys(this.data);
    }
}

export default LocationDataset;