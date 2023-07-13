const express=require('express');
const productRouter=express.Router();
const {createProduct,getProduct,deleteProduct, updateProduct}=require('../controller/productController');
const functions=require('../common/commonFunction');

productRouter.post('/createProduct',functions.auth,createProduct);

productRouter.get('/getProduct',functions.auth,getProduct);

productRouter.delete('/deleteProduct/:_id',functions.auth,deleteProduct);

productRouter.put('/updateProduct/:_id',functions.auth,updateProduct);

module.exports=productRouter;