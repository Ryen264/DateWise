import {Plans, Tags} from '../models/planModel.js';
import { Locations } from '../models/locationModel.js';
import LocationDataset from '../models/locationDataset.js';
import PlanDataset from '../models/planDataset.js';
import Plan from '../models/plan.js';
import Utils from '../utils/utils.js';

// Send data to the server
const createPlan = async (req, res) => {
  try {
    const plan = new Plans(req.body);
    await plan.save();
    res.status(201).send(plan);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Receive data from the server
const getTags = async (req, res) => {
    try {
        const tags = await Tags.find();
        // res.status(200).send(tags);
        return tags;
    } catch (error) {
        res.status(500).send
    }
}

const generatePlan = async (req, res) => {
  try {

      // Default parameters
      const avgTimePerLocation = 1.5;
      const maxPoolSize = 10;
      const budgetTimeRatio = 0.5;
      const budgetProbThreshold = 0.2;
      const timeThreshold = 0;

      // Load datasets
      const locationDataset = new LocationDataset();
      await locationDataset.initialize();
      const userId = 'USR-001'; // TODO: Lấy userId từ session

      // Find the most recent plan for the user based on plan id (format: yymmdd-hhmmss)
      const mostRecentPlan = await Plans.findOne({ PLAN_USER: userId }).sort({ _id: -1 });

      // Lấy cái đầu tiên sau khi sort
      // const mostRecentPlan = await Plans.find({ PLAN_USER: userId }).sort({ PLAN_ID: 1 }).limit(1);


      console.log('Most recent plan:', mostRecentPlan);

      if (!mostRecentPlan) {
          return res.status(404).send({ message: 'No plans found for this user.' });
      }
      // const planId = mostRecentPlan._id;
      const planId = '250101-175042';

      // Press Make a new plan and give plan orders -> Get a Plan ID
      const planDataset = new PlanDataset(
          locationDataset,
          avgTimePerLocation
      );
      await planDataset.initialize();

      const plan = new Plan(
          planId,
          planDataset,
          locationDataset,
          maxPoolSize,
          budgetTimeRatio,
          budgetProbThreshold,
          timeThreshold
      );

      // console.log('LocationDataset:', locationDataset.data);
      // 
      console.log('PlanDataset:', planDataset.data);
      console.log('Plan', plan.data);

      // Generate plan and show Plan Detail
      const generatedPlanDetail = plan.generatePlan(locationDataset);

      const planDetailsWithLocName = await Promise.all(
        generatedPlanDetail.map(async (detail) => {
          const location = await Locations.findById(detail.DETAIL_LOC);
          return {
            ...detail,
            LOC_NAME: location ? location.name : null,
            LOC_FADDRESS: location ? location.address : null,
            LOC_DESCR: location ? location.description : null,
          };
        })
      );

      console.log('Generated Plan Detail:', planDetailsWithLocName);
      
      // res.status(200).json(generatedPlanDetail);
      res.status(200).json(planDetailsWithLocName);

  } catch (error) {
      console.error('Error generating plan:', error);
      res.status(500).send({ error: 'Internal server error' });
  }
};

export { createPlan, getTags, generatePlan };