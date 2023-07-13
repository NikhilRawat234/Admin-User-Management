const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({

    shopId: {
        type: mongoose.Types.ObjectId,
        ref: 'shops'
    },
    categoryName: {
        type: "String",
        required: true
    },
    status:{
        type:String,
        enum:['Blocked','Deleted','Active'],
        default:'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('categories', shopSchema);


