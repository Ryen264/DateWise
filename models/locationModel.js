import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
   
    _id: { type: String, required: true},
    name: {type: String, required: true},
    address: {type: String, required: true, unique: true},
    district: {type: String, required: true},
    tag: {type: Date, required: true},
    phone: {type: String, default: ''},
    workingHours: {type: String, default: ''},
    rating: {type: String, default: ''},
    reviews: {type: String, default: ''},
    price: {type: String, default: ''},
    photo: {type: String, default: ''},
    logo: {type: String, default: ''},
    link: {type: String, default: ''}
});


const Locations = mongoose.model('locations', locationSchema);
export {Locations};