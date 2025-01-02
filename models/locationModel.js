import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    _id: { type: String, required: true},
    name: {type: String, required: true},
    address: {type: String, required: true},
    district: {type: String, required: true},
    tag: {type: String, required: true},
    phone: {type: String, required: true},
    rating: {type: Number, required: true},
    reviews: {type: Number, required: true},
    price: {type: Number, required: true},
    description: {type: String, required: false},
    site: {type: String, required: false},
    photo: {type: String, required: false},
    logo: {type: String, required: false},
    link: {type: String, required: false},
});

const Locations = mongoose.model('locations', locationSchema);
export {Locations};