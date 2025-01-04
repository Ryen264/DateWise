import Utils from '../utils/utils.js';
import PlanDataset from './planDataset.js';
import LocationDataset from './locationDataset.js';
import {Plans} from '../models/planModel.js';

class Plan {
  constructor(
    planDocument,
    locationDataset,
    avgTimePerLocation = 1.5,
    maxPoolSize = 10,
    budgetTimeRatio = 0.5,
    budgetProbThreshold = 0.2,
    timeThreshold = 0
  ) {

    // kiểm tra planDocument có phải database Plans không
    if (!(planDocument instanceof Plans)) {
      throw new Error('Invalid plan document.');
    }

    this.id = planDocument._id;
    this.budget = parseFloat(planDocument.PLAN_MAXBUDGET) || 1000;
    this.startTime = parseFloat(planDocument.PLAN_STARTTIME) || 9;
    this.endTime = parseFloat(planDocument.PLAN_ENDTIME) || 21;
    this.hoursSum = this.endTime - this.startTime;
    this.isLunchTime = Utils.checkinLunchTime(this.startTime) || Utils.checkinLunchTime(this.endTime);
    this.isDinnerTime = Utils.checkinDinnerTime(this.startTime) || Utils.checkinDinnerTime(this.endTime);
    this.restaurantsNum = parseInt(this.isLunchTime + this.isDinnerTime) || 1;
    const maxLocsNum = parseInt(this.hoursSum / avgTimePerLocation) || 1;
    this.maxOthersNum = maxLocsNum - this.restaurantsNum || 1;
    // this.restaurants = planDataset.getRestaurants(planId);
    // this.others = planDataset.getOthers(planId);
    if (!(locationDataset instanceof LocationDataset)) {
      throw new Error('Invalid locationDataset: Must be an instance of LocationDataset');
    }

    // this.id = planId;
    // this.budget = planDataset.getBudget(planId);
    // this.startTime = planDataset.getStartTime(planId);
    // this.endTime = planDataset.getEndTime(planId);
    // this.hoursSum = planDataset.getHoursSum(planId);
    // this.isLunchTime = planDataset.getIsLunchTime(planId);
    // this.isDinnerTime = planDataset.getIsDinnerTime(planId);
    // this.restaurantsNum = planDataset.getRestaurantsNum(planId);
    // this.maxOthersNum = planDataset.getMaxOthersNum(planId);
    // this.restaurants = planDataset.getRestaurants(planId);
    // this.others = planDataset.getOthers(planId);
    // this.budgetProbThreshold = budgetProbThreshold;
    // this.timeThreshold = timeThreshold;
    const plan_district = planDocument.PLAN_DISTRICT || 'District 1';
    const districtLocations = locationDataset
        .getLocations()
        .filter((loc) => locationDataset.getDistrict(loc) === plan_district);

    const plan_cuisines = planDocument.PLAN_CUISINES || ['CUIS-02'];
    const plan_mcourses = planDocument.PLAN_MCOURSES || ['MCOU-09'];
    const plan_desserts = planDocument.PLAN_DESSERTS || ['DEDR-011'];
    const plan_activities = planDocument.PLAN_ACTIVITIES || ['ACTI-05'];

    this.restaurants = districtLocations.filter(
      (loc) =>
        plan_cuisines.includes(locationDataset.getTag(loc)) ||
        plan_mcourses.includes(locationDataset.getTag(loc))
    );
    if (this.restaurants.length < this.restaurantsNum) {
        for (const loc of districtLocations) {
            if (locationDataset.getType(loc) === 'Restaurant' && !this.restaurants.includes(loc)) {
                this.restaurants.push(loc);
            }
        }
    }

    this.others = districtLocations.filter(
        (loc) =>
          plan_desserts.includes(locationDataset.getTag(loc)) ||
          plan_activities.includes(locationDataset.getTag(loc))
    );
    // Generate plan pool for each plan
    const maxIterations = this.maxOthersNum;
    let planLocsLst = [];
    let overallDistanceLst = [];
    let attempts = 0;
    const maxAttempts = 100; // Maximum attempts to generate a valid plan

    do{
      planLocsLst = [];
      overallDistanceLst = [];
      attempts++;

      for (let n = 0; n < maxPoolSize; n++) {
        const numRestaurantsToPick = Math.min(this.restaurantsNum, this.restaurants.length);
        const pickedRestaurants = Utils.pickRandoms(this.restaurants, numRestaurantsToPick);
  
        const numOthersToPick = Math.min(this.maxOthersNum, this.others.length);
        const others = Utils.pickRandoms(this.others, numOthersToPick);
        let pickedOthers = others;
  
        let planLocs = pickedRestaurants.concat(pickedOthers);
  
        let overallDistance = Utils.calculateOverallDistance(
          planLocs,
          this.budget,
          this.hoursSum,
          locationDataset,
          budgetTimeRatio,
          budgetProbThreshold,
          timeThreshold
        );

        if (overallDistance < 0) {
          for (let othersNum = this.maxOthersNum - 1; othersNum > 0; othersNum--) {
            for (let _ = 0; _ < maxIterations; _++) {
              const numOthersToPick = Math.min(othersNum, others.length);
              pickedOthers = Utils.pickRandoms(others, numOthersToPick);
  
              planLocs = pickedRestaurants.concat(pickedOthers);
              overallDistance = Utils.calculateOverallDistance(
                planLocs,
                this.budget,
                this.hoursSum,
                locationDataset,
                budgetTimeRatio,
                budgetProbThreshold,
                timeThreshold
              );
  
              if (overallDistance >= 0) break;
            }
            if (overallDistance >= 0) break;
          }
          if (overallDistance < 0) {
            planLocs = pickedRestaurants;
            overallDistance = Utils.calculateOverallDistance(
              planLocs,
              this.budget,
              this.hoursSum,
              locationDataset,
              budgetTimeRatio,
              budgetProbThreshold,
              timeThreshold
            );
          }
        }
  
        if (overallDistance >= 0) {
          planLocsLst.push(planLocs);
          overallDistanceLst.push(overallDistance);
        }
      }

      if (planLocsLst.length === 0 && attempts < maxAttempts) {
        for (let n = 0; n < maxPoolSize; n++) {
          const pickedRestaurants = Utils.pickRandoms(this.restaurants, this.restaurantsNum);
          let planLocs = pickedRestaurants;
    
          let overallDistance = Utils.calculateOverallDistance(
            planLocs,
            this.budget,
            this.hoursSum,
            locationDataset,
            budgetTimeRatio,
            budgetProbThreshold,
            timeThreshold
          );
    
          if (overallDistance >= 0) {
            planLocsLst.push(planLocs);
            overallDistanceLst.push(overallDistance);
          }
        }
      }
    }while (planLocsLst.length === 0 && attempts < maxAttempts);

    // Check if no valid plans were generated at all
    // if (planLocsLst.length === 0) {
    //   console.error("Failed to generate any valid plans.");
    //   return; // Or handle the error as appropriate for your application
    // }

    if (planLocsLst.length === 0) {
      const location = locationDataset.getLocations();
      for(let n = 0; n < (this.restaurantsNum + this.maxOthersNum) * 2 - 1; n++) {
        planLocsLst.push([location[n], location[n + 1]]);
      }
    }

    // Calculate probability of each plan by softmax function
    const planProbabilities = Utils.softmax(overallDistanceLst);

    console.log('Plan locations:', planLocsLst);
    console.log('Plan probabilities:', planProbabilities);

    // Create plan pool contains pairs (locations, probability) of a picked plan
    this.planPool = planLocsLst.map((locs, index) => [locs, planProbabilities[index]]);

    this.locations = [];

    // Setup default parameters for model
    this.budgetDistance = -1;
    this.timeDistance = -1;
    this.overallDistance = -1;
    this.planDetail = [];
  }

  generatePlan(locationDataset) {
    console.log(this.planPool);

    // Step 1: Pick weighted random a list of locations in plan pool
    this.locations = Utils.weightedRandomlyPick(this.planPool);

    // Step 2: Fill locations into timeline
    const timerange = Utils.generateTimepoints(this.startTime, this.endTime);

    let timeline = {};
    for (const time of timerange) {
      timeline[Utils.convertFloatHoursToStr(time)] = null;
    }

    timeline = Utils.schedulePlan(
      this.locations,
      timeline,
      this.isLunchTime,
      this.isDinnerTime,
      this.startTime,
      this.endTime,
      locationDataset
    );

    // Step 3: Convert into list[dict] plan detail
    this.planDetail = [];
    if(timeline === null) {
      console.log('Failed to generate plan.');
      return this.planDetail;
    }
    timeline = Utils.removeDuplicateLocs(timeline);
    for (const [time, loc] of Object.entries(timeline)) {
      if (loc !== null) {
        this.planDetail.push({
          DETAIL_ID: this.id,
          DETAIL_TIME: time,
          DETAIL_LOC: loc,
        });
      }
    }
    return this.planDetail;
  }
  async acceptPlan() {
    try{
      // Step 4: Save plan detail to database
      for (const detail of this.planDetail) {
        await Plans.create(detail);
      }
      console.log('Plan accepted.');
    } catch (error) {
      console.error('Failed to accept plan:', error);
    }

  }
}

export default Plan;