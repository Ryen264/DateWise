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

export default Utils;