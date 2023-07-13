const express = require("express");
const {
  signUp,
  OtpVerification,
  verifyEmail,
  resendOtp,
  login,
  getUserList,
  getUserByQuery,
  editProfile,
  forgetPassword,
  changePassword,
  productlist,
  productField,
  resetPassword,productlistByAggregate,
} = require("../controller/userController");
const userRouter = express.Router();
const functions = require("../common/commonFunction");
userRouter.post("/signUp", signUp);
userRouter.put("/OtpVerification", OtpVerification);
userRouter.get("/verifyEmail/:Email", verifyEmail);
userRouter.put("/resendOtp", resendOtp);
userRouter.post("/login", login);
userRouter.get("/getUserList", getUserList);
userRouter.put('/editProfile',functions.auth,editProfile)
userRouter.get("/getUserByQuery", getUserByQuery);
userRouter.put("/forgetPassword", forgetPassword);
userRouter.put("/changePassword",changePassword)
userRouter.put('/resetPassword',resetPassword);
userRouter.get('/productlist',functions.auth,productlist);
userRouter.get('/productField',functions.auth,productField);
userRouter.get('/productlistByAggregate',functions.auth,productlistByAggregate);
module.exports = userRouter;


