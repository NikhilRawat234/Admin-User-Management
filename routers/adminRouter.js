const express=require('express');
const adminRouter=express.Router();
const {adminLogin,changePassword,adminForgetPswrd,resetPassword}=require('../controller/adminController')
const functions=require('../common/commonFunction')
adminRouter.post('/adminLogin',adminLogin);

adminRouter.put('/changePassword',functions.auth,changePassword);

adminRouter.put('/adminForgetPswrd',adminForgetPswrd);

adminRouter.put('/resetPassword',resetPassword);

module.exports=adminRouter;