import numpy as np
import random
from pymongo import MongoClient

class LocationDataset:
    def __init__(self, connection_string: str, db_name: str):
        self.client = MongoClient(connection_string)
        self.db = self.client[db_name]

        location_list = Utils.get_collection(self.db, 'LOCATION')
        self.location_dict = {}
        for record in location_list:
            self.location_dict[str(record['_id'])] = {
                'district': str(record['LOC_DISTRICT']),
                'tag': str(record['LOC_TAG']),
                'price': int(record['LOC_PRICE'])
            }

        tag_list = Utils.get_collection(self.db, 'TAG')
        self.tag_dict = {}
        for record in tag_list:
            self.tag_dict[str(record['_id'])] = str(record['TAG_TYPE'])

        avg_spending_time_list = Utils.get_collection(self.db, 'AVERAGE_SPENDING_TIME')
        self.avg_spending_time_dict = {}
        for record in avg_spending_time_list:
            self.avg_spending_time_dict[str(record['TYPE_NAME'])] = float(record['TYPE_AVGHOUR'])

        self.data = {}
        for location_id, location_info in self.location_dict.items():
            self.data[location_id] = {
                'district': location_info['district'],
                'tag': location_info['tag'],
                'price': location_info['price'],
                'type': self.tag_dict[location_info['tag']],
                'avg_spending_time': self.avg_spending_time_dict[self.tag_dict[location_info['tag']]]
            }

    def get_district(self, location_id: str) -> str:
        """
        Get district of a location.
        """
        return self.data[location_id]['district']
    
    def get_tag(self, location_id: str) -> str:
        """
        Get tag of a location.
        """
        return self.data[location_id]['tag']
    
    def get_price(self, location_id: str) -> int:
        """
        Get price of a location.
        """
        return self.data[location_id]['price']
    
    def get_type(self, location_id: str) -> str:
        """
        Get type of a location.
        """
        return self.data[location_id]['type']

    def get_avg_spending_time(self, location_id: str) -> float:
        """
        Get average spending time of a location.
        """
        return self.data[location_id]['avg_spending_time']
    
    def get_locations(self) -> list[str]:
        """
        Get all locations (in ids) in the dataset.
        """
        return list(self.data.keys())

class PlanDataset:
    def __init__(self, connection_string: str, db_name: str, location_dataset: LocationDataset, avg_time_per_location: float=1.5):
        self.client = MongoClient(connection_string)
        self.db = self.client[db_name]

        plan_list = Utils.get_collection(self.db, 'PLAN')
        self.plan_dict = {}
        for record in plan_list:
            self.plan_dict[str(record['_id'])] = {
                'district': str(record['PLAN_DISTRICT']),
                'budget': int(record['PLAN_MAXBUDGET']),
                'start_time': float(record['PLAN_STARTTIME']),
                'end_time': float(record['PLAN_ENDTIME']),
                'cuisines': str(record['PLAN_CUISINES']),
                'mcourses': str(record['PLAN_MCOURSES']),
                'desserts': str(record['PLAN_DESSERTS']),
                'activities': str(record['PLAN_ACTIVITES'])
            }

        self.data = {}
        for plan_id, plan_info in self.plan_dict.items():
            lunch_time = Utils.checkin_lunch_time(plan_info['start_time']) or Utils.checkin_lunch_time(plan_info['end_time'])
            dinner_time = Utils.checkin_dinner_time(plan_info['start_time']) or Utils.checkin_dinner_time(plan_info['end_time'])

            max_locs_num = int((plan_info['end_time'] - plan_info['start_time']) / avg_time_per_location)
            restaurants_num = lunch_time + dinner_time

            district_locations = [loc for loc in location_dataset.get_locations() if location_dataset.get_district(loc) == plan_info['district']]

            cuisines = Utils.split_string(plan_info['cuisines'], len('CUIS-01'))
            mcourses = Utils.split_string(plan_info['mcourses'], len('MCOU-01'))
            desserts = Utils.split_string(plan_info['desserts'], len('DEDR-01'))
            activities = Utils.split_string(plan_info['activities'], len('ACTI-01'))

            restaurants = [loc for loc in district_locations if location_dataset.get_tag(loc) in cuisines or location_dataset.get_tag(loc) in mcourses]
            # pick more other restaurants if not enough
            if len(restaurants) < restaurants_num:
                for loc in district_locations:
                    if location_dataset.get_type(loc)=='Restaurant':
                        restaurants.append(loc)

            others = [loc for loc in district_locations if location_dataset.get_tag(loc) in desserts or location_dataset.get_tag(loc) in activities]

            self.data[plan_id] = {
                'budget': plan_info['budget'],
                'start_time': plan_info['start_time'],
                'end_time': plan_info['end_time'],
                'hours_sum': plan_info['end_time'] - plan_info['start_time'],
                'is_lunch_time': lunch_time,
                'is_dinner_time': dinner_time,
                'restaurants_num': int(lunch_time + dinner_time),
                'max_others_num': max_locs_num - restaurants_num,
                'restaurants': restaurants,
                'others': others,
            }

    def get_budget(self, plan_id: str) -> int:
        """
        Get budget of a plan.
        """
        return self.data[plan_id]['budget']
    
    def get_start_time(self, plan_id: str) -> float:
        """
        Get start time of a plan.
        """
        return self.data[plan_id]['start_time']
    
    def get_end_time(self, plan_id: str) -> float:
        """
        Get end time of a plan.
        """
        return self.data[plan_id]['end_time']

    def get_hours_sum(self, plan_id: str) -> float:
        """
        Get sum of hours of a plan.
        """
        return self.data[plan_id]['hours_sum']
    
    def get_is_lunch_time(self, plan_id: str) -> bool:
        """
        Get whether plan time is in lunch time of a plan.
        """
        return self.data[plan_id]['is_lunch_time']

    def get_is_dinner_time(self, plan_id: str) -> bool:
        """
        Get whether plan time is in dinner time of a plan.
        """
        return self.data[plan_id]['is_dinner_time']
    
    def get_restaurants_num(self, plan_id: str) -> int:
        """
        Get number of restaurants of a plan.
        """
        return self.data[plan_id]['restaurants_num']
    
    def get_max_others_num(self, plan_id: str) -> int:
        """
        Get max number of other locations of a plan.
        """
        return self.data[plan_id]['max_others_num']
    
    def get_restaurants(self, plan_id: str) -> list[str]:
        """
        Get list of satisfied restaurants of a plan.
        """
        return self.data[plan_id]['restaurants']
    
    def get_others(self, plan_id: str) -> list[str]:
        """
        Get list of satisfied other locations of a plan.
        """
        return self.data[plan_id]['others']
    
    def get_plans(self) -> list[str]:
        """
        Get all plans (in ids) in the dataset.
        """
        return list(self.data.keys())

class Plan:
    def __init__(self, plan_id: str, plan_dataset: PlanDataset, location_dataset: LocationDataset, max_pool_size: int=10, budget_time_ratio: float=0.5, budget_prob_threshold: float=0.2, time_threshold: int=0):
        self.id = plan_id
        self.budget = plan_dataset.get_budget(plan_id)
        self.start_time = plan_dataset.get_start_time(plan_id)
        self.end_time = plan_dataset.get_end_time(plan_id)
        self.hours_sum = plan_dataset.get_hours_sum(plan_id)
        self.is_lunch_time = plan_dataset.get_is_lunch_time(plan_id)
        self.is_dinner_time = plan_dataset.get_is_dinner_time(plan_id)
        self.restaurants_num = plan_dataset.get_restaurants_num(plan_id)
        self.max_others_num = plan_dataset.get_max_others_num(plan_id)
        self.restaurants = plan_dataset.get_restaurants(plan_id)
        self.others = plan_dataset.get_others(plan_id)

        self.budget_prob_threshold = budget_prob_threshold
        self.time_threshold = time_threshold

        # Generate plan pool for each plan
        max_iterations = self.max_others_num
        plan_locs_lst = []
        overall_distance_lst = []
        for n in range(max_pool_size):
            num_restaurants_to_pick = min(self.restaurants_num, len(self.restaurants))
            picked_restaurants = Utils.pick_randoms(self.restaurants, num_restaurants_to_pick)

            num_others_to_pick = min(self.max_others_num, len(self.others))
            others = Utils.pick_randoms(self.others, num_others_to_pick)
            picked_others = others

            plan_locs = picked_restaurants + picked_others

            overall_distance = Utils.calculate_overall_distance(plan_locs, self.budget, self.hours_sum, location_dataset, budget_time_ratio, budget_prob_threshold, time_threshold)
            if overall_distance < 0:
                for others_num in range(self.max_others_num - 1, 0, -1):
                    for _ in range(max_iterations):
                        num_others_to_pick = min(others_num, len(others))
                        picked_others = Utils.pick_randoms(others, num_others_to_pick)

                        plan_locs = picked_restaurants + picked_others
                        overall_distance = Utils.calculate_overall_distance(plan_locs, self.budget, self.hours_sum, location_dataset, budget_time_ratio, budget_prob_threshold, time_threshold)

                        if overall_distance >= 0: break
                    if overall_distance >= 0: break
                if overall_distance < 0:
                    plan_locs = picked_restaurants
                    overall_distance = Utils.calculate_overall_distance(plan_locs, self.budget, self.hours_sum, location_dataset, budget_time_ratio, budget_prob_threshold, time_threshold)

            if (overall_distance >= 0):
                plan_locs_lst.append(plan_locs)
                overall_distance_lst.append(overall_distance)

        # Calculate probability of each plan by softmax function
        plan_probabilities = Utils.softmax(np.array(overall_distance_lst))

        # Create plan pool contains pairs (locations, probability) of a picked plan
        self.plan_pool = list(zip(plan_locs_lst, plan_probabilities))

        self.locations = []

        # Setup default parameters for model
        self.budget_distance = -1
        self.time_distance = -1
        self.overall_distance = -1

    def generate_plan(self, location_dataset: LocationDataset) -> list[dict]:
        """
        Generate a plan detail.
        """
        # Step 1: Pick weighted random a list of locations in plan pool
        self.locations = Utils.weighted_randomly_pick(self.plan_pool)

        # Step 2: Fill locations into timeline
        timerange = Utils.generate_timepoints(self.start_time, self.end_time)

        timeline = {}
        for time in timerange:
            timeline[Utils.convert_float_hours_to_str(time)] = None

        timeline = Utils.schedule_plan(self.locations, timeline, self.is_lunch_time, self.is_dinner_time, self.start_time, self.end_time, location_dataset)

        # Step 3: Convert into list[dict] plan detail
        self.plan_detail = []
        timeline = Utils.remove_duplicate_locs(timeline)
        for time, loc in timeline.items():
            if loc is not None:
                self.plan_detail.append({
                    'DETAIL_ID': self.id,
                    'DETAIL_TIME': time,
                    'DETAIL_LOC': loc
                })
        return self.plan_detail

    def accept_plan(self, connection_string: str, db_name: str):
        """
        Upload plan detail to database to save
        """
        client = MongoClient(connection_string)
        db = client[db_name]
        collection = db['PLAN_DETAIL']

        if not self.plan_detail:
            print("Warning: No data to upload.")
            return None

        result = collection.insert_many(self.plan_detail)
        print(f"Successfully inserted {len(result.inserted_ids)} documents.")

class Utils:
    @staticmethod
    def get_collection(db: dict, collection_name: str) -> list[dict]:
        """
        Get all documents in a collection.
        """
        return list(db[collection_name].find())

    @staticmethod
    def checkin_time(hours: float, starttime: float, endtime: float) -> bool:
        """
        Check if a given time is within a specific range.
        """
        return starttime <= hours <= endtime

    @staticmethod
    def checkin_timerange(starthours: float, endhours: float, starttime: float, endtime: float, eps: float = 0.1) -> bool:
        """
        Check if a given time range is within a specific range.
        """
        return (starttime - eps <= starthours <= endtime + eps) and (starttime - eps <= endhours <= endtime + eps)

    @staticmethod
    def checkin_lunch_time(time: float, start_lunch_time: int = 11, end_lunch_time: int = 13) -> bool:
        """
        Check if a given time is within lunch time.
        """
        return start_lunch_time <= time <= end_lunch_time

    @staticmethod
    def checkin_dinner_time(time: float, start_dinner_time: int = 17, end_dinner_time: int = 19) -> bool:
        """
        Check if a given time is within dinner time.
        """
        return start_dinner_time <= time <= end_dinner_time

    @staticmethod
    def split_string(string, length = 7) -> list[str]:
        """
        Split a string into a list of substrings of a given length.
        """
        return [string[i:i+length] for i in range(0, len(string), length)]
    
    @staticmethod
    def pick_randoms(lst: list[str], elements_num: int) -> list[str]:
        """
        Randomly pick some unique elements in a string list (id list).
        """
        return random.sample(lst, elements_num)

    @staticmethod
    def softmax(scores_lst: np.ndarray, lamda: float=-1.0) -> np.ndarray:
        """
        Compute softmax values for each score in a list with lamda.
        x -> softmax(x) = exp(lamda * x) / sum(exp(lamda * x))
        """
        return np.exp(lamda * scores_lst) / np.sum(np.exp(lamda * scores_lst))

    @staticmethod
    def weighted_randomly_pick(elements_with_probabilities: list):
        """
        Randomly picks an element from a list of elements with associated probabilities.
        """
        r = random.random()
        accumulator = 0
        for element, prob in elements_with_probabilities:
            accumulator += prob
            if accumulator >= r:
                return element
        return elements_with_probabilities[-1][0]  # Return the last element as a fallback

    @staticmethod
    def fill_zeros_str(number_str: str, n_digits: int) -> str:
        """
        Fill zeros before a string to get str with n_digits (e.g. "9", digits_num = 2 -> "09")
        """
        filled_zeros = n_digits - len(number_str)
        return ('0' * filled_zeros + number_str) if filled_zeros > 0 else number_str

    @staticmethod
    def convert_float_hours_to_str(float_hours: float) -> str:
        """
        Convert float hours (e.g. 17.5) to str hours (e.g. "17:30").
        """
        hours = int(float_hours)
        MAX_HOUR_DIGITS = 2
        str_hours = Utils.fill_zeros_str(str(hours), MAX_HOUR_DIGITS)

        MINS_PER_HOUR = 60
        minutes = int((float_hours - hours) * MINS_PER_HOUR)
        MAX_MINUTE_DIGITS = 2
        str_minutes = Utils.fill_zeros_str(str(minutes), MAX_MINUTE_DIGITS)

        return str_hours + ':' + str_minutes

    @staticmethod
    def convert_str_time_to_float(str_time: str) -> float:
        """
        Convert str hours (e.g. "17:30") to float hours (e.g. 17.5).
        """
        lst_time = str_time.split(':')
        str_hours, str_minutes = lst_time[0], lst_time[1]

        MINS_PER_HOUR = 60
        return int(str_hours) + int(str_minutes) / MINS_PER_HOUR

    @staticmethod
    def generate_timepoints(starttime: float, endtime: float, get_end: bool=False, step: float=0.5) -> list[float]:
        """
        Generate timepoints in a range [starttime, endtime].
        """
        timepoints_num = int((endtime - starttime) / step) + get_end
        return [(starttime + i * step) for i in range(timepoints_num)]

    @staticmethod
    def mark_timeline(loc: str, time: float, timeline: dict) -> dict:
        """
        Mark a location (id) at a timepoint in a timeline.
        """
        if timeline[Utils.convert_float_hours_to_str(time)] is not None:
            return None
        timeline[Utils.convert_float_hours_to_str(time)] = loc
        return timeline

    @staticmethod
    def fill_timeline(loc: str, fromtime: float, timeline: dict, location_dataset: LocationDataset) -> dict:
        """
        Fill a location (id) in a timeline.
        """
        totime = fromtime + location_dataset.get_avg_spending_time(loc)
        latest_time = list(timeline.keys())[-1]
        hours_step = 0.5

        if totime > Utils.convert_str_time_to_float(latest_time) + hours_step:
            return None

        timepoints = Utils.generate_timepoints(fromtime, totime, get_end=False, step=hours_step)
        for timepoint in timepoints:
            tmp_timeline = Utils.mark_timeline(loc, timepoint, timeline)
            if tmp_timeline is None:
                return None
            timeline = tmp_timeline
        return timeline

    @staticmethod
    def pick_a_loc(locs: list, location_dataset: LocationDataset, loctype: str=None) -> str:
        """
        Pick a location (id) in a list of locations.
        """
        if len(locs) == 0:
            return None

        random.shuffle(locs)  # Use random.shuffle(locs) instead of locs.shuffle()
        if loctype is None:
            return locs[0]

        for loc in locs:
            if location_dataset.get_type(loc) == loctype:
                return loc
        return None

    @staticmethod
    def limit_timerange(starttime: float, endtime: float, timerange: list[float]) -> list[float]:
        """
        Limit timerange to [starttime, endtime].
        """
        for time in timerange:
            if time < starttime or time > endtime:
                timerange.remove(time)
        return timerange
    
    @staticmethod
    def remove_duplicate_locs(timeline: dict) -> dict:
        """
        Removes timepoints in time line with the same 'loc' value, keeping only the first occurrence.
        """
        seen_locs = set()
        new_timeline = {}
        for time, loc in timeline.items():
            if loc not in seen_locs:
                seen_locs.add(loc)
                new_timeline[time] = loc
        return new_timeline
    
    @staticmethod
    def calculate_budget_distance(plan_locs: list[str], input_budget: int, location_dataset: LocationDataset, prob_threshold: float=0.2) -> int:
        """
        Calculate budget distance due to input budget and list of location ids of a plan.
        """
        prices = [location_dataset.get_price(loc) for loc in plan_locs if loc in location_dataset.get_locations()]
        prob_budget_distance = np.abs(input_budget - np.sum(prices)) / input_budget

        # assign -1 if over the threshold
        return prob_budget_distance if prob_budget_distance <= prob_threshold else -1

    @staticmethod
    def calculate_time_distance(plan_locs: list[str], input_hours_sum: float, location_dataset: LocationDataset, threshold: float=0) -> float:
        """
        Calculate time distance due to input hours sum and list of location ids of a plan.
        """
        avg_hours = [location_dataset.get_avg_spending_time(loc) for loc in plan_locs if loc in location_dataset.get_locations()]
        time_distance = input_hours_sum - np.sum(avg_hours)

        # assign -1 if over the threshold
        return time_distance / input_hours_sum if time_distance >= threshold else -1

    @staticmethod
    def calculate_overall_distance(plan_locs: list[str], input_budget: int, input_hours_sum: float, location_dataset: LocationDataset, budget_time_ratio: float=0.5, budget_prob_threshold: float=0.2, time_threshold: float=0) -> float:
        """
        Calculate overall distance due to input budget, hours sum and list of location ids of a plan.
        """
        budget_distance = Utils.calculate_budget_distance(plan_locs, input_budget, location_dataset, budget_prob_threshold)
        time_distance = Utils.calculate_time_distance(plan_locs, input_hours_sum, location_dataset, time_threshold)
        if budget_distance == -1 or time_distance == -1:
            return -1

        return budget_distance * budget_time_ratio + time_distance * (1 - budget_time_ratio)
    
    @staticmethod
    def schedule_plan(plan_locs: list[str], timeline: dict, is_lunch_time: bool, is_dinner_time: bool, starttime: float, endtime: float, location_dataset: LocationDataset) -> dict:
        """
        Schedule a plan in a timeline.
        """
        if is_lunch_time or is_dinner_time:
            # Pick a restaurant
            restaurant = Utils.pick_a_loc(plan_locs, location_dataset, 'Restaurant')
            if restaurant is None:
                return None

            tmp_plan_locs = plan_locs.copy()
            tmp_plan_locs.remove(restaurant)

            if is_lunch_time:
                lunch_timerange = Utils.limit_timerange(starttime, endtime - location_dataset.get_avg_spending_time(restaurant), Utils.generate_timepoints(starttime=11, endtime=13, get_end=True))
                for lunch_time in lunch_timerange:
                    tmp_timeline = Utils.fill_timeline(restaurant, lunch_time, timeline, location_dataset)
                    if tmp_timeline is not None:
                        tmp_timeline = Utils.schedule_plan(tmp_plan_locs, tmp_timeline, False, is_dinner_time, starttime, endtime, location_dataset)
                        if tmp_timeline is not None:
                            return tmp_timeline

            if is_dinner_time:
                dinner_timerange = Utils.limit_timerange(starttime, endtime - location_dataset.get_avg_spending_time(restaurant), Utils.generate_timepoints(starttime=17, endtime=19, get_end=True))
                for dinner_time in dinner_timerange:
                    tmp_timeline = Utils.fill_timeline(restaurant, dinner_time, timeline, location_dataset)
                    if tmp_timeline is not None:
                        tmp_timeline = Utils.schedule_plan(tmp_plan_locs, tmp_timeline, is_lunch_time, False, starttime, endtime, location_dataset)
                        if tmp_timeline is not None:
                            return tmp_timeline

        # Pick a location
        location = Utils.pick_a_loc(plan_locs, location_dataset, None)
        if location is None:
            return timeline

        plan_locs.remove(location)

        free_timerange = [Utils.convert_str_time_to_float(time) for time in timeline.keys() if timeline[time] is None]
        for free_time in free_timerange:
            tmp_timeline = Utils.fill_timeline(location, free_time, timeline, location_dataset)
            if tmp_timeline is not None:
                tmp_timeline = Utils.schedule_plan(plan_locs, tmp_timeline, is_lunch_time, is_dinner_time, starttime, endtime, location_dataset)
                if tmp_timeline is not None:
                    return tmp_timeline
        return None


def main():
    # MongoDB key
    connection_string = "mongodb+srv://giabao:lenguyengiabao@datewise.hxajp.mongodb.net/?retryWrites=true&w=majority&appName=DateWise"
    db_name = 'AppData'

    # Default parameters
    avg_time_per_location=1.5
    max_pool_size = 10
    budget_time_ratio = 0.5
    budget_prob_threshold = 0.2
    time_threshold = 0

    # Load datasets
    location_dataset = LocationDataset(connection_string, db_name)
    plan_dataset = PlanDataset(connection_string, db_name, location_dataset, avg_time_per_location)

    # Press Make a new plan and give plan orders -> Get a Plan ID
    plan_id = "241112-001030"
    plan = Plan(plan_id, plan_dataset, location_dataset, max_pool_size, budget_time_ratio, budget_prob_threshold, time_threshold)

    # Press Generate plan and show Plan Detail
    generated_plan_detail = plan.generate_plan(location_dataset)
    print(generated_plan_detail)

    # Press Re-Generate plan and show Plan Detail
    regenerated_plan_detail = plan.generate_plan(location_dataset)
    print(regenerated_plan_detail)

    # Press Accept this plan and save Plan Detail
    plan.accept_plan(connection_string, db_name)

if __name__ == "__main__":
    main()