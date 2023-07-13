const express=require('express');
const shopRouter=express();
const {adminLogin,createShop,deleteShop,updateShop,getShop,getShopById}=require('../controller/shopController');
const functions=require('../common/commonFunction')

shopRouter.post('/adminLogin',adminLogin)

shopRouter.post('/createShop',functions.auth,createShop);

shopRouter.delete('/deleteShop/:_id',functions.auth,deleteShop);

shopRouter.put('/updateShop',functions.auth,updateShop);

shopRouter.get('/getShop',functions.auth,getShop);

shopRouter.get('/getShopById/:_id',functions.auth,getShopById);

module.exports=shopRouter;