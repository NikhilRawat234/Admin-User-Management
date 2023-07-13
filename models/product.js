const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  categoryId: {
    type: mongoose.Types.ObjectId,
    ref: 'categories'
  },
  productImage:{
    type:String
  },
  status:{
    type:String,
    enum:['Blocked','Deleted','Active'],
    default:'Active'
  }
},{ timestamps: true });

module.exports = mongoose.model('products', productSchema);
