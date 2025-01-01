// PlanGenModel.js

import { MongoClient } from 'mongodb';

class LocationDataset {
  constructor(connectionString, dbName) {
    this.connectionString = connectionString;
    this.dbName = dbName;
    this.locationDict = {};
    this.tagDict = {};
    this.avgSpendingTimeDict = {};
    this.data = {};
  }

  async initialize() {
    this.client = await MongoClient.connect(this.connectionString);
    this.db = this.client.db(this.dbName);

    const locationList = await this.getCollection('LOCATION');
    for (const record of locationList) {
      this.locationDict[record._id.toString()] = {
        district: record.LOC_DISTRICT.toString(),
        tag: record.LOC_TAG.toString(),
        price: parseInt(record.LOC_PRICE),
      };
    }

    const tagList = await this.getCollection('TAG');
    for (const record of tagList) {
      this.tagDict[record._id.toString()] = record.TAG_TYPE.toString();
    }

    const avgSpendingTimeList = await this.getCollection('AVERAGE_SPENDING_TIME');
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

  async getCollection(collectionName) {
    return await this.db.collection(collectionName).find({}).toArray();
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

class PlanDataset {
  constructor(connectionString, dbName, locationDataset, avgTimePerLocation = 1.5) {
    this.connectionString = connectionString;
    this.dbName = dbName;
    this.locationDataset = locationDataset;
    this.avgTimePerLocation = avgTimePerLocation;
    this.planDict = {};
    this.data = {};
  }

  async initialize() {
    this.client = await MongoClient.connect(this.connectionString);
    this.db = this.client.db(this.dbName);

    const planList = await this.getCollection('PLAN');
    // for (const record of planList) {
    //   this.planDict[record._id.toString()] = {
    //     district: record.PLAN_DISTRICT.toString(),
    //     budget: parseInt(record.PLAN_MAXBUDGET),
    //     startTime: parseFloat(record.PLAN_STARTTIME),
    //     endTime: parseFloat(record.PLAN_ENDTIME),
    //     cuisines: record.PLAN_CUISINES.toString() ,
    //     mcourses: record.PLAN_MCOURSES.toString(),
    //     desserts: record.PLAN_DESSERTS.toString(),
    //     activities: record.PLAN_ACTIVITES.toString(),
    //   };
    // }
    for (const record of planList) {
      this.planDict[record._id.toString()] = {
      district: record.PLAN_DISTRICT.toString(),
      budget: parseFloat(record.PLAN_MAXBUDGET),
      startTime: parseFloat(record.PLAN_STARTTIME),
      endTime: parseFloat(record.PLAN_ENDTIME),
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

  async getCollection(collectionName) {
    return await this.db.collection(collectionName).find({}).toArray();
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

class Plan {
  constructor(
    planId,
    planDataset,
    locationDataset,
    maxPoolSize = 10,
    budgetTimeRatio = 0.5,
    budgetProbThreshold = 0.2,
    timeThreshold = 0
  ) {
    this.id = planId;
    this.budget = planDataset.getBudget(planId);
    this.startTime = planDataset.getStartTime(planId);
    this.endTime = planDataset.getEndTime(planId);
    this.hoursSum = planDataset.getHoursSum(planId);
    this.isLunchTime = planDataset.getIsLunchTime(planId);
    this.isDinnerTime = planDataset.getIsDinnerTime(planId);
    this.restaurantsNum = planDataset.getRestaurantsNum(planId);
    this.maxOthersNum = planDataset.getMaxOthersNum(planId);
    this.restaurants = planDataset.getRestaurants(planId);
    this.others = planDataset.getOthers(planId);

    this.budgetProbThreshold = budgetProbThreshold;
    this.timeThreshold = timeThreshold;

    // Generate plan pool for each plan
    const maxIterations = this.maxOthersNum;
    const planLocsLst = [];
    const overallDistanceLst = [];
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

    // Calculate probability of each plan by softmax function
    const planProbabilities = Utils.softmax(overallDistanceLst);

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

  async acceptPlan(connectionString, dbName) {
    const client = await MongoClient.connect(connectionString);
    const db = client.db(dbName);
    const collection = db.collection('PLAN_DETAIL');

    if (!this.planDetail || this.planDetail.length === 0) {
      console.log('Warning: No data to upload.');
      return null;
    }

    const result = await collection.insertMany(this.planDetail);
    console.log(`Successfully inserted ${result.insertedCount} documents.`);
    await client.close();
  }
}

class Utils {
  static checkinTime(hours, starttime, endtime) {
    return starttime <= hours && hours <= endtime;
  }

  static checkinTimerange(starthours, endhours, starttime, endtime, eps = 0.1) {
    return (
      starttime - eps <= starthours &&
      starthours <= endtime + eps &&
      starttime - eps <= endhours &&
      endhours <= endtime + eps
    );
  }

  static checkinLunchTime(time, startLunchTime = 11, endLunchTime = 13) {
    return startLunchTime <= time && time <= endLunchTime;
  }

  static checkinDinnerTime(time, startDinnerTime = 17, endDinnerTime = 19) {
    return startDinnerTime <= time && time <= endDinnerTime;
  }

  static splitString(string, length = 7) {
    const result = [];
    for (let i = 0; i < string.length; i += length) {
      result.push(string.substring(i, i + length));
    }
    return result;
  }

  static pickRandoms(lst, elementsNum) {
    return this.shuffle(lst).slice(0, elementsNum);
  }

  static softmax(scoresLst, lambda = -1.0) {
    const expScores = scoresLst.map((x) => Math.exp(lambda * x));
    const sumExpScores = expScores.reduce((a, b) => a + b, 0);
    return expScores.map((x) => x / sumExpScores);
  }

  static weightedRandomlyPick(elementsWithProbabilities) {
    const r = Math.random();
    let accumulator = 0;
    for (const [element, prob] of elementsWithProbabilities) {
      accumulator += prob;
      if (accumulator >= r) {
        return element;
      }
    }
    return elementsWithProbabilities[elementsWithProbabilities.length - 1][0]; // Return the last element as a fallback
  }

  static fillZerosStr(numberStr, nDigits) {
    const filledZeros = nDigits - numberStr.length;
    return filledZeros > 0 ? '0'.repeat(filledZeros) + numberStr : numberStr;
  }

  static convertFloatHoursToStr(floatHours) {
    const hours = parseInt(floatHours);
    const strHours = this.fillZerosStr(hours.toString(), 2);

    const minutes = parseInt((floatHours - hours) * 60);
    const strMinutes = this.fillZerosStr(minutes.toString(), 2);

    return strHours + ':' + strMinutes;
  }

  static convertStrTimeToFloat(strTime) {
    const [strHours, strMinutes] = strTime.split(':');
    return parseInt(strHours) + parseInt(strMinutes) / 60;
  }

  static generateTimepoints(starttime, endtime, getEnd = false, step = 0.5) {
    const timepointsNum = parseInt((endtime - starttime) / step) + (getEnd ? 1 : 0);
    return Array.from({ length: timepointsNum }, (_, i) => starttime + i * step);
  }

  static markTimeline(loc, time, timeline) {
    if (timeline[this.convertFloatHoursToStr(time)] !== null) {
      return null;
    }
    timeline[this.convertFloatHoursToStr(time)] = loc;
    return timeline;
  }

  static fillTimeline(loc, fromtime, timeline, locationDataset) {
    const totime = fromtime + locationDataset.getAvgSpendingTime(loc);
    const latestTime = Object.keys(timeline).pop();
    const hoursStep = 0.5;

    if (totime > this.convertStrTimeToFloat(latestTime) + hoursStep) {
      return null;
    }

    const timepoints = this.generateTimepoints(fromtime, totime, false, hoursStep);
    for (const timepoint of timepoints) {
      const tmpTimeline = this.markTimeline(loc, timepoint, timeline);
      if (tmpTimeline === null) {
        return null;
      }
      timeline = tmpTimeline;
    }
    return timeline;
  }

  static pickALoc(locs, locationDataset, loctype = null) {
    if (locs.length === 0) {
      return null;
    }

    this.shuffle(locs);
    if (loctype === null) {
      return locs[0];
    }

    for (const loc of locs) {
      if (locationDataset.getType(loc) === loctype) {
        return loc;
      }
    }
    return null;
  }

  static limitTimerange(starttime, endtime, timerange) {
    return timerange.filter((time) => time >= starttime && time <= endtime);
  }

  static removeDuplicateLocs(timeline) {
    const seenLocs = new Set();
    const newTimeline = {};
    for (const [time, loc] of Object.entries(timeline)) {
      if (!seenLocs.has(loc)) {
        seenLocs.add(loc);
        newTimeline[time] = loc;
      }
    }
    return newTimeline;
  }

  static calculateBudgetDistance(
    planLocs,
    inputBudget,
    locationDataset,
    probThreshold = 0.2
  ) {
    const prices = planLocs
      .filter((loc) => locationDataset.getLocations().includes(loc))
      .map((loc) => locationDataset.getPrice(loc));
    const probBudgetDistance = Math.abs(inputBudget - prices.reduce((a, b) => a + b, 0)) / inputBudget;

    return probBudgetDistance <= probThreshold ? probBudgetDistance : -1;
  }

  static calculateTimeDistance(planLocs, inputHoursSum, locationDataset, threshold = 0) {
    const avgHours = planLocs
      .filter((loc) => locationDataset.getLocations().includes(loc))
      .map((loc) => locationDataset.getAvgSpendingTime(loc));
    const timeDistance = inputHoursSum - avgHours.reduce((a, b) => a + b, 0);

    return timeDistance >= threshold ? timeDistance / inputHoursSum : -1;
  }

  static calculateOverallDistance(
    planLocs,
    inputBudget,
    inputHoursSum,
    locationDataset,
    budgetTimeRatio = 0.5,
    budgetProbThreshold = 0.2,
    timeThreshold = 0
  ) {
    const budgetDistance = this.calculateBudgetDistance(
      planLocs,
      inputBudget,
      locationDataset,
      budgetProbThreshold
    );
    const timeDistance = this.calculateTimeDistance(
      planLocs,
      inputHoursSum,
      locationDataset,
      timeThreshold
    );
    if (budgetDistance === -1 || timeDistance === -1) {
      return -1;
    }

    return budgetDistance * budgetTimeRatio + timeDistance * (1 - budgetTimeRatio);
  }

  static schedulePlan(
    planLocs,
    timeline,
    isLunchTime,
    isDinnerTime,
    starttime,
    endtime,
    locationDataset
  ) {
    if (isLunchTime || isDinnerTime) {
      const restaurant = this.pickALoc(planLocs, locationDataset, 'Restaurant');
      if (restaurant === null) {
        return null;
      }

      const tmpPlanLocs = [...planLocs];
      tmpPlanLocs.splice(tmpPlanLocs.indexOf(restaurant), 1);

      if (isLunchTime) {
        const lunchTimerange = this.limitTimerange(
          starttime,
          endtime - locationDataset.getAvgSpendingTime(restaurant),
          this.generateTimepoints(11, 13, true)
        );
        for (const lunchTime of lunchTimerange) {
          let tmpTimeline = this.fillTimeline(restaurant, lunchTime, { ...timeline }, locationDataset);
          if (tmpTimeline !== null) {
            tmpTimeline = this.schedulePlan(
              tmpPlanLocs,
              tmpTimeline,
              false,
              isDinnerTime,
              starttime,
              endtime,
              locationDataset
            );
            if (tmpTimeline !== null) {
              return tmpTimeline;
            }
          }
        }
      }

      if (isDinnerTime) {
        const dinnerTimerange = this.limitTimerange(
          starttime,
          endtime - locationDataset.getAvgSpendingTime(restaurant),
          this.generateTimepoints(17, 19, true)
        );
        for (const dinnerTime of dinnerTimerange) {
          let tmpTimeline = this.fillTimeline(restaurant, dinnerTime, { ...timeline }, locationDataset);
          if (tmpTimeline !== null) {
            tmpTimeline = this.schedulePlan(
              tmpPlanLocs,
              tmpTimeline,
              isLunchTime,
              false,
              starttime,
              endtime,
              locationDataset
            );
            if (tmpTimeline !== null) {
              return tmpTimeline;
            }
          }
        }
      }
    }
    const location = this.pickALoc(planLocs, locationDataset, null);
    if (location === null) {
      return timeline;
    }

    const tmpPlanLocs = [...planLocs];
    tmpPlanLocs.splice(tmpPlanLocs.indexOf(location), 1);

    const freeTimerange = Object.entries(timeline)
      .filter(([_, value]) => value === null)
      .map(([key, _]) => this.convertStrTimeToFloat(key));
    for (const freeTime of freeTimerange) {
      let tmpTimeline = this.fillTimeline(location, freeTime, { ...timeline }, locationDataset);
      if (tmpTimeline !== null) {
        tmpTimeline = this.schedulePlan(
          tmpPlanLocs,
          tmpTimeline,
          isLunchTime,
          isDinnerTime,
          starttime,
          endtime,
          locationDataset
        );
        if (tmpTimeline !== null) {
          return tmpTimeline;
        }
      }
    }
    return null;
  }

  static shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

async function main() {
  // MongoDB key
  const connectionString =
    'mongodb+srv://giabao:lenguyengiabao@datewise.hxajp.mongodb.net/?retryWrites=true&w=majority&appName=DateWise';
  const dbName = 'AppData';

  // Default parameters
  const avgTimePerLocation = 1.5;
  const maxPoolSize = 10;
  const budgetTimeRatio = 0.5;
  const budgetProbThreshold = 0.2;
  const timeThreshold = 0;

  // Load datasets
  const locationDataset = new LocationDataset(connectionString, dbName);
  await locationDataset.initialize();
  const userId = 'USR-001';

  // Press Make a new plan and give plan orders -> Get a Plan ID
  const planDataset = new PlanDataset(
    connectionString,
    dbName,
    locationDataset,
    avgTimePerLocation
  );
  await planDataset.initialize();
  console.log('PlanDataset initialized', planDataset.getPlans());

  const planId = '241112-001030';
  const plan = new Plan(
    planId,
    planDataset,
    locationDataset,
    maxPoolSize,
    budgetTimeRatio,
    budgetProbThreshold,
    timeThreshold
  );

  // // Press Generate plan and show Plan Detail
  // const generatedPlanDetail = plan.generatePlan(locationDataset);
  // console.log(generatedPlanDetail);

  // // Press Re-Generate plan and show Plan Detail
  // const regeneratedPlanDetail = plan.generatePlan(locationDataset);
  // console.log(regeneratedPlanDetail);

  // // Press Accept this plan and save Plan Detail
  // await plan.acceptPlan(connectionString, dbName);
}

main();