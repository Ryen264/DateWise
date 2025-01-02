import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    PLAN_USER: {type: String, required: true},
    PLAN_DATE: {type: String, required: true},
    PLAN_DISTRICT: {type: String, required: false},
    PLAN_MAXBUDGET: {type: String, required: false},
    PLAN_STARTTIME: {type: String, required: false},
    PLAN_ENDTIME: {type: String, required: false},
    PLAN_CUISINES: {type: [String], default: []},
    PLAN_MCOURSES: {type: [String], default: []},
    PLAN_DESSERTS: {type: [String], default: []},
    PLAN_ACTIVITIES: {type: [String], default: []},
}, {collection: 'PLAN'});

const tagSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    TAG_TYPE: {type: String, required: true},
    TAG_NAME: {type: String, required: true},
    TAG_CATE: {type: String, required: true},
}, {collection: 'TAG'});

const averageSpendingTimeSchema = new mongoose.Schema({
    _id: {type: Object, required: true},
    TYPE_NAME: {type: String, required: true},
    TYPE_AVGHOUR: {type: String, required: true},
    TYPE_DESCR: {type: String, required: true},
}, {collection: 'AVERAGE_SPENDING_TIME'});

const Plans = mongoose.model('Plans', planSchema);
const Tags = mongoose.model('Tags', tagSchema);
const AverageSpendingTime = mongoose.model('AverageSpendingTime', averageSpendingTimeSchema);

export {Plans, Tags, AverageSpendingTime};