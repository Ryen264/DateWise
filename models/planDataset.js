import { Plans } from '../models/planModel.js';
import Utils from '../utils/utils.js';
import LocationDataset from './locationDataset.js';



class PlanDataset {
    constructor(locationDataset, avgTimePerLocation = 1.5) {
      if (!(locationDataset instanceof LocationDataset)) {
        throw new Error("Invalid locationDataset: Must be an instance of LocationDataset");
      }  

        this.locationDataset = locationDataset;
        this.avgTimePerLocation = avgTimePerLocation;
        this.planDict = {};
        this.data = {};
    }

    async initialize() {

        const planList = await Plans.find();

        for (const record of planList) {
            this.planDict[record._id.toString()] = {
            district: record.PLAN_DISTRICT.toString() || 'District 1',
            budget: parseFloat(record.PLAN_MAXBUDGET) || 1000,
            startTime: parseFloat(record.PLAN_STARTTIME) || 9,
            endTime: parseFloat(record.PLAN_ENDTIME) || 21,
            cuisines: record.PLAN_CUISINES,
            mcourses: record.PLAN_MCOURSES,
            desserts: record.PLAN_DESSERTS,
            activities: record.PLAN_ACTIVITIES,
            };
        }

        for (const [planId, planInfo] of Object.entries(this.planDict)) {
            const lunchTime =
                Utils.checkinLunchTime(planInfo.startTime) || Utils.checkinLunchTime(planInfo.endTime);
            const dinnerTime =
                Utils.checkinDinnerTime(planInfo.startTime) || Utils.checkinDinnerTime(planInfo.endTime);

            const maxLocsNum = parseInt(
                (planInfo.endTime - planInfo.startTime) / this.avgTimePerLocation
            );
            const restaurantsNum = lunchTime + dinnerTime;

            const districtLocations = this.locationDataset
                .getLocations()
                .filter((loc) => this.locationDataset.getDistrict(loc) === planInfo.district);

            // const cuisines = Utils.splitString(planInfo.cuisines, 'CUIS-01'.length);
            // const mcourses = Utils.splitString(planInfo.mcourses, 'MCOU-01'.length);
            // const desserts = Utils.splitString(planInfo.desserts, 'DEDR-01'.length);
            // const activities = Utils.splitString(planInfo.activities, 'ACTI-01'.length);

            const cuisines = planInfo.cuisines;
            const mcourses = planInfo.mcourses;
            const desserts = planInfo.desserts;
            const activities = planInfo.activities;

            let restaurants = districtLocations.filter(
                (loc) =>
                cuisines.includes(this.locationDataset.getTag(loc)) ||
                mcourses.includes(this.locationDataset.getTag(loc))
            );
            if (restaurants.length < restaurantsNum) {
                for (const loc of districtLocations) {
                if (this.locationDataset.getType(loc) === 'Restaurant') {
                    restaurants.push(loc);
                }
                }
                restaurants = [...new Set(restaurants)];
            }

            const others = districtLocations.filter(
                (loc) =>
                desserts.includes(this.locationDataset.getTag(loc)) ||
                activities.includes(this.locationDataset.getTag(loc))
            );

            this.data[planId] = {
                budget: planInfo.budget,
                startTime: planInfo.startTime,
                endTime: planInfo.endTime,
                hoursSum: planInfo.endTime - planInfo.startTime,
                isLunchTime: lunchTime,
                isDinnerTime: dinnerTime,
                restaurantsNum: parseInt(lunchTime + dinnerTime),
                maxOthersNum: maxLocsNum - restaurantsNum,
                restaurants: restaurants,
                others: others,
            };
        }
  }

  getBudget(planId) {
    return this.data[planId].budget;
  }

  getStartTime(planId) {
    return this.data[planId].startTime;
  }

  getEndTime(planId) {
    return this.data[planId].endTime;
  }

  getHoursSum(planId) {
    return this.data[planId].hoursSum;
  }

  getIsLunchTime(planId) {
    return this.data[planId].isLunchTime;
  }

  getIsDinnerTime(planId) {
    return this.data[planId].isDinnerTime;
  }

  getRestaurantsNum(planId) {
    return this.data[planId].restaurantsNum;
  }

  getMaxOthersNum(planId) {
    return this.data[planId].maxOthersNum;
  }

  getRestaurants(planId) {
    return this.data[planId].restaurants;
  }

  getOthers(planId) {
    return this.data[planId].others;
  }

  getPlans() {
    return Object.keys(this.data);
  }
}

export default PlanDataset;