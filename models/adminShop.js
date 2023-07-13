const mongoose = require('mongoose');


const shopSchema = new mongoose.Schema({
    shopName: {
        type: String,
        required: true,

    },
    city: {
        type: String,
        required: true
    },
    coordinates: {
        latitude: {
            type: Number,
            require: true
        },
        longitude: {
            type: Number,
            require: true
        }
    },
    shopImage:{
        type:String,
    },
    status:{
        type:String,
        enum:['Blocked','Deleted','Active'],
        default:'Active'
    }

}, { timestamps: true });

module.exports = mongoose.model('shops', shopSchema);


