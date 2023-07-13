const express=require('express');
const staticRouter=express.Router();
const functions=require('../common/commonFunction')
const {updateStaticContent,getAllStaticData,getStaticData,adminLogin,editStatic}=require('../controller/staticController');


staticRouter.put('/updateStaticContent',updateStaticContent);

staticRouter.get('/getAllStaticData/:type',getAllStaticData);

staticRouter.get('/getStaticData',getStaticData);

staticRouter.post('/adminLogin',adminLogin);

staticRouter.put('/editStatic/:_id',functions.auth,editStatic);
module.exports=staticRouter;