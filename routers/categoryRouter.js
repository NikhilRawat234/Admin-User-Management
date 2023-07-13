const express=require('express')
const {createCategory,deleteCategory,getCategoryById,getCategory,updateCategory}=require('../controller/categoryController');
const functions=require('../common/commonFunction');
const shopRouter=express();

shopRouter.post('/createCategory',functions.auth,createCategory);

shopRouter.delete('/deleteCategory/:_id',functions.auth,deleteCategory);

shopRouter.get('/getCategoryById/:_id',functions.auth,getCategoryById);

shopRouter.get('/getCategory',functions.auth, getCategory);

shopRouter.put('/updateCategory/:_id',functions.auth,updateCategory)
module.exports=shopRouter;