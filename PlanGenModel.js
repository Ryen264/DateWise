// PlanGenModel.js

// const { MongoClient, ObjectId } = require('mongodb');
import { MongoClient } from 'mongodb';

class LocationDataset {
  constructor(database) {
    this.location_dict = {};
    this.tag_dict = {};
    this.avg_spending_time_dict = {};
    this.data = {};
    this.database = database;
  }

  async initialize() {
    const location_list = await Utils.getCollection(this.database, 'locations');
    location_list.forEach(record => {
        this.location_dict[record._id.toString()] = {
            district: record.district.toString(),
            tag: record.tag.toString(),
            price: parseInt(record.price)
        };
    });

    const tag_list = await Utils.getCollection(this.database, 'TAG');
    tag_list.forEach(record => {
        this.tag_dict[record._id.toString()] = record.TAG_TYPE.toString();
    });

    const avg_spending_time_list = await Utils.getCollection(this.database, 'AVERAGE_SPENDING_TIME');
    avg_spending_time_list.forEach(record => {
        this.avg_spending_time_dict[record.TYPE_NAME.toString()] = parseFloat(record.TYPE_AVGHOUR);
    });

    for (const location_id in this.location_dict) {
        const location_info = this.location_dict[location_id];
        this.data[location_id] = {
            district: location_info.district,
            tag: location_info.tag,
            price: location_info.price,
            type: this.tag_dict[location_info.tag],
            avg_spending_time: this.avg_spending_time_dict[this.tag_dict[location_info.tag]]
        };
    }
}
  // ... rest of the LocationDataset class ...
}

class Plan {
    constructor(plan_id, database, location_dataset, avg_time_per_location = 1.5, max_pool_size = 10, budget_time_ratio = 0.5, budget_prob_threshold = 0.2, time_threshold = 0) {
        this.id = plan_id;
        this.plan_detail = [];
        this.database = database;
        this.location_dataset = location_dataset;
        this.avg_time_per_location = avg_time_per_location;
        this.max_pool_size = max_pool_size;
        this.budget_time_ratio = budget_time_ratio;
        this.budget_prob_threshold = budget_prob_threshold;
        this.time_threshold = time_threshold;

    }

    async initialize() {
        const plan_document = await Utils.getDocumentById(this.database, 'PLAN', this.id);
        this.budget = parseInt(plan_document.PLAN_MAXBUDGET);
        this.start_time = parseFloat(plan_document.PLAN_STARTTIME);
        this.end_time = parseFloat(plan_document.PLAN_ENDTIME);
        this.hours_sum = this.end_time - this.start_time;
        this.is_lunch_time = Utils.checkin_lunch_time(this.start_time) || Utils.checkin_lunch_time(this.end_time);
        this.is_dinner_time = Utils.checkin_dinner_time(this.start_time) || Utils.checkin_dinner_time(this.end_time);
        this.restaurants_num = parseInt(this.is_lunch_time + this.is_dinner_time);

        const max_locs_num = parseInt(this.hours_sum / this.avg_time_per_location);
        this.max_others_num = max_locs_num - this.restaurants_num;

        const plan_district = plan_document.PLAN_DISTRICT.toString();
        const district_locations = this.location_dataset.get_locations().filter(loc => this.location_dataset.get_district(loc) === plan_district);

        const plan_cuisines = plan_document.PLAN_CUISINES;
        const plan_mcourses = plan_document.PLAN_MCOURSES;
        this.restaurants = district_locations.filter(loc => plan_cuisines.includes(this.location_dataset.get_tag(loc)) || plan_mcourses.includes(this.location_dataset.get_tag(loc)));

        // pick more other restaurants if not enough
        if (this.restaurants.length < this.restaurants_num) {
            for (const loc of district_locations) {
                if (this.location_dataset.get_type(loc) === 'Restaurant') {
                    this.restaurants.push(loc);
                }
            }
        }

        const plan_desserts = plan_document.PLAN_DESSERTS;
        const plan_activities = plan_document.PLAN_ACTIVITIES;
        this.others = district_locations.filter(loc => plan_desserts.includes(this.location_dataset.get_tag(loc)) || plan_activities.includes(this.location_dataset.get_tag(loc)));

        // Generate plan pool for each plan
        const max_iterations = this.max_others_num;
        const plan_locs_lst = [];
        const overall_distance_lst = [];
        for (let n = 0; n < this.max_pool_size; n++) {
            const num_restaurants_to_pick = Math.min(this.restaurants_num, this.restaurants.length);
            const picked_restaurants = Utils.pick_randoms(this.restaurants, num_restaurants_to_pick);

            const num_others_to_pick = Math.min(this.max_others_num, this.others.length);
            const others = Utils.pick_randoms(this.others, num_others_to_pick);
            const picked_others = others;

            let plan_locs = picked_restaurants.concat(picked_others);

            let overall_distance = Utils.calculate_overall_distance(plan_locs, this.budget, this.hours_sum, this.location_dataset, this.budget_time_ratio, this.budget_prob_threshold, this.time_threshold);
            if (overall_distance < 0) {
                for (let others_num = this.max_others_num - 1; others_num > 0; others_num--) {
                    for (let _ = 0; _ < max_iterations; _++) {
                        const num_others_to_pick = Math.min(others_num, this.others.length);
                        const picked_others = Utils.pick_randoms(others, num_others_to_pick);

                        plan_locs = picked_restaurants.concat(picked_others);
                        overall_distance = Utils.calculate_overall_distance(plan_locs, this.budget, this.hours_sum, this.location_dataset, this.budget_time_ratio, this.budget_prob_threshold, this.time_threshold);

                        if (overall_distance >= 0) break;
                    }
                    if (overall_distance >= 0) break;
                }
                if (overall_distance < 0) {
                    plan_locs = picked_restaurants;
                    overall_distance = Utils.calculate_overall_distance(plan_locs, this.budget, this.hours_sum, this.location_dataset, this.budget_time_ratio, this.budget_prob_threshold, this.time_threshold);
                }
            }

            if (overall_distance >= 0) {
                plan_locs_lst.push(plan_locs);
                overall_distance_lst.push(overall_distance);
            }
        }

        // Calculate probability of each plan by softmax function
        const plan_probabilities = Utils.softmax(overall_distance_lst);

        // Create plan pool contains pairs (locations, probability) of a picked plan
        this.plan_pool = plan_locs_lst.map((plan_locs, index) => [plan_locs, plan_probabilities[index]]);

        this.locations = [];

        // Setup default parameters for model
        this.budget_distance = -1;
        this.time_distance = -1;
        this.overall_distance = -1;
    }
  // ... rest of the Plan class ...
}

class Utils {
  static async getCollection(database, collection_name) {
    return await database.collection(collection_name).find({}).toArray();
  }

  static async findLatestId(database, field_name, value, collection_name) {
    const latestDocument = await database.collection(collection_name).findOne({ [field_name]: value }, { sort: { _id: -1 } });
    return latestDocument._id.toString();
  }

  static async getDocumentById(database, collection_name, id) {
    return await database.collection(collection_name).findOne({ _id: id });
  }

  // ... other static methods in the Utils class ...
}

async function main() {
  // Default parameters
  const avg_time_per_location = 1.5;
  const max_pool_size = 10;
  const budget_time_ratio = 0.5;
  const budget_prob_threshold = 0.2;
  const time_threshold = 0;

  // MongoDB connection string
  const connection_string =
    "mongodb+srv://giabao:lenguyengiabao@datewise.hxajp.mongodb.net/?retryWrites=true&w=majority&appName=DateWise";
  const db_name = "AppData";

  // Connect to MongoDB
  const client = new MongoClient(connection_string);
  try {
    await client.connect();
    const database = client.db(db_name);

    // Load datasets
    const user_id = "USR-001";
    const location_dataset = new LocationDataset(database);
    await location_dataset.initialize(); // Initialize LocationDataset after it's created

    // Press Make a new plan and give plan orders
    // Find latest Plan ID having {'PLAN_USER': User ID}
    // const plan_id = await Utils.findLatestId(database, "PLAN_USER", user_id, "PLAN");
    const plan_id = '241112-001030';

    // Create Plan object
    const plan = new Plan(
      plan_id,
      database,
      location_dataset,
      avg_time_per_location,
      max_pool_size,
      budget_time_ratio,
      budget_prob_threshold,
      time_threshold
    );
    await plan.initialize(); // Initialize Plan after it's created

    // Press Generate plan and show Plan Detail
    const generated_plan_detail = plan.generate_plan(location_dataset);
    console.log("Generated Plan Detail:", generated_plan_detail);

    // Press Re-Generate plan and show Plan Detail
    const regenerated_plan_detail = plan.generate_plan(location_dataset);
    console.log("Regenerated Plan Detail:", regenerated_plan_detail);

    // Press Accept this plan and save Plan Detail
    await plan.accept_plan(connection_string, db_name);
  } catch (err) {
    console.error("Error in main:", err);
  } finally {
    await client.close();
  }
}

main();