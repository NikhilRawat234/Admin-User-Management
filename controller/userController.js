const model = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secretKey = "charu";
const functions = require("../common/commonFunction");
const productModel = require("../models/product");

module.exports = {
  signUp: async (req, res) => {
    try {
      const {
        FirstName,
        LastName,
        Email,
        Mobile,
        Countrycode,
        Password,
        Address,
        DateOfBirth,
      } = req.body;
      const missingFields = await functions.validation(req.body);
      if (missingFields.length > 0) {
        const errorMessages = missingFields.map(
          (field) => `${field} is required.`
        );
        return res
          .status(400)
          .send({ responseCode: 400, responseMessage: errorMessages });
      }
      const user = await model.findOne({
        Email: Email,
        status: { $ne: "Deleted" },
        userType: "User",
      });
      if (user) {
        if (user.status === "Blocked") {
          return res.status(403).send({
            responseCode: 403,
            responseMessage: "You are blocked by Administrator",
          });
        } else {
          return res.status(409).send({
            responseCode: 409,
            responseMessage: "You already have an account ",
          });
        }
      }
      if (!user) {
        let { otp, expirationTime } = functions.generateOtp();
        const commonURL = `http://localhost:8000/api/verifyEmail/${Email}`;
        await functions.sendMail(
          req.body.Email,
          "Email verification This email sent for verification of Your mail ",
          `<p>Please verify your email by clicking <a href="${commonURL}">Click Here</a>.</p><p>and Your OTP is${otp}</p>`
        );
        let pass = bcrypt.hashSync(Password, 10);
        const newUser = {
          FirstName: FirstName,
          LastName: LastName,
          Email: Email,
          Mobile: Mobile,
          Countrycode: Countrycode,
          Password: pass,
          Address: Address,
          DateOfBirth: DateOfBirth,
          UserName: "UserName",
          otp: otp,
          expirationTime: expirationTime,
        };

        const result = await model.create(newUser);
        return res.status(200).send({
          responseCode: 200,
          responseMessage: "Please verify your OTP...",
          responseResult: result,
        });
      }
    } catch (error) {
      return res.status(501).send({
        responseCode: 501,
        responseMessage: "Something went wrong..!",
        responseResult: error,
      });
    }
  },

  OtpVerification: async (req, res) => {
    try {
      const { Email, otp } = req.body;
      if (
        Email == undefined ||
        Email == "" ||
        (Email == null && otp == undefined) ||
        otp == null ||
        otp == ""
      ) {
        return res.status(400).send({
          responseCode: 400,
          responceMessage: "Email and OTP are required",
        });
      } else {
        const userEmail = await model.findOne({ Email: Email });
        if (userEmail) {
          const otp = userEmail.otp;
          if (otp === req.body.otp) {
            const currentTime = Date.now();
            if (currentTime > userEmail.expirationTime) {
              return res.status(400).send({
                responseCode: 400,
                responseMessage: "Otp has been expierd",
              });
            } else {
              await model.updateOne(
                { Email: userEmail.Email },
                {
                  $set: { is_verified: true },
                  $unset: { otp: 1, expirationTime: 1 },
                }
              );
              return res.status(200).send({
                responseCode: 200,
                responseMessage: "Otp verified Successfully*_*!",
              });
            }
          } else {
            return res.status(400).send({
              responseCode: 400,
              responceMessage: "Invalid Otp!",
            });
          }
        }
      }
    } catch (error) {
      return res.status(501).send({
        responseCode: 501,
        responseMessage: "Something went wrong!",
        error,
      });
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const email = req.params.Email;
      const user = await model.findOneAndUpdate(
        { Email: email, is_verifyEmail: { $ne: true } },
        { $set: { is_verifyEmail: true } }
      );

      if (!user) {
        return res.status(200).send({
          responseCode: 200,
          responseMessage: "Your email is already verified.*_*",
        });
      }

      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Email verification successful!.*_*",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Failed to verify email.*_*",
        error,
      });
    }
  },

  resendOtp: async (req, res) => {
    try {
      const { Email } = req.body;
      const userEmail = await model.findOne({ Email: Email });

      if (!userEmail) {
        return res
          .status(404)
          .send({ responseCode: 404, responceMessage: "user not found" });
      }
      const { otp, expirationTime } = functions.generateOtp();

      await functions.sendMail(
        req.body.Email,
        "Otp verification",
        `Your otp is ${otp}`
      );
      await model.findByIdAndUpdate(
        userEmail._id,
        { $set: { otp: otp, expirationTime: expirationTime } },
        { new: true }
      );
      return res.status(200).send({
        responseCode: 200,
        responseMessage: "otp has been successfully sent on ur mail",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong",
        responseResult: error,
      });
    }
  },

  login: async (req, res) => {
    try {
      const { Email, Password } = req.body;
      if (
        Email == undefined ||
        Email == "" ||
        (Email == null && Password == undefined) ||
        Password == null ||
        Password == ""
      ) {
        return res.status(400).send({
          responseCode: 400,
          responceMessage: "Email and password are required",
        });
      }
      const userEmail = await model.findOne({ Email: Email });
      if (!userEmail) {
        return res.status(404).send({
          responseCode: 404,
          responceMessage: "Email not found,Check you email and try again...",
        });
      }
      if (userEmail) {
        const userPassword = bcrypt.compareSync(Password, userEmail.Password);
        if (userPassword) {
          if (
            userEmail.is_verified === true &&
            userEmail.is_verifyEmail === true
          ) {
            const token = jwt.sign({ _id: userEmail._id }, secretKey, {
              expiresIn: "24h",
            });
            return res.status(200).send({
              responseCode: 200,
              responceMessage: "login successful!*~* ",
              token,
            });
          } else {
            if (
              userEmail.is_verified === false &&
              userEmail.is_verifyEmail === true
            ) {
              return res.status(403).send({
                responseCode: 403,
                responceMessage: "Please verify your otp",
              });
            } else if (
              userEmail.is_verified === true &&
              userEmail.is_verifyEmail === false
            ) {
              return res.status(403).send({
                responseCode: 403,
                responseMessage: "Please verify your link",
              });
            } else {
              return res.status(403).send({
                responseCode: 403,
                responseMessage: "Please verify your OTP and your Email",
              });
            }
          }
        } else {
          return res.status(400).send({
            responseCode: 400,
            responceMessage: "Password is incorrect",
          });
        }
      }
    } catch (error) {
      return res.status(501).send({
        responseCode: 501,
        responceMessage: "Something went wrong..!",
        error: error,
      });
    }
  },

  getUserList: async (req, res) => {
    try {
      const users = await model.find({ userType: "User" }).select("-Password");
      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Users Data retrieved successfully*_*",
        users: users,
      });
    } catch (error) {
      console.error("Error in getUsers:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong*_*",
        error: error,
      });
    }
  },

  getUserByQuery: async (req, res) => {
    try {
      const userID = req.query;
      const user = await model.findOne({ _id: userID }).select("-Password");
      if (!user) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "User not found.",
        });
      } else {
        return res.status(200).send({
          responseCode: 200,
          responseMessage: "User retrieved successfully.",
          user: user,
        });
      }
    } catch (error) {
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.*_*",
        error: error,
      });
    }
  },

  //   try {
  //     const userData=await model.find({_id:req.userId});
  //     console.log(userData);
  //     if(!userData){
  //       return res.status(404).send({responseCode:404,responseMessage:"User not found"});
  //     }
  //     const {Email,Mobile,UserName,Password}=req.body;

  //     if(Password){
  //       const password=bcrypt.hashSync(Password,10);

  //       await model.findByIdAndUpdate({_id:userData._id},{$set:{Password:password}});
  //       return res.status(200).send({responseCode:200,responseMessage:"Your Password updated successfully.*_*"});
  //     }    if(Email&&UserName&&Mobile){
  //       const user= await model.findOne({$and:[
  //         {$or:[{Email:Email},{UserName:UserName},{Mobile:Mobile}]},{_id:{$ne:req.userId}}
  //       ]});
  //       if(user){
  //         if(user.Email===Email){
  //           return res.status(409).send({responseCode:409,responseMessage:"Email is registered with another account.^_^"});
  //         }else if(user.UserName===UserName){
  //           return res.status(409).send({responseCode:409,responseMessage:"UserName is existing with another account.^_^"});
  //         }else if(user.Mobile===Mobile){
  //           return res.status(409).send({responseCode:409,responseMessage:"This Mobile number is registered with another account.^_^"});
  //         }
  //       }
  //       await functions.sendMail(userData.Email,"Your email ,UserName and mobile has been changed.*_*.","<P>Enjoy</P>");
  //       const Data=await model.findByIdAndUpdate({_id:userData._id},{$set:{Email:req.body.Email,UserName:req.body.UserName,Mobile:req.body.Mobile}},{new:true});
  //       return res.status(200).send({responseCode:200,responseMessage:"Email , UserName and Mobile has been changed successfully.*_*",responseResult:Data})

  //     }else if(!Email && UserName && Mobile){
  //       const user= await model.findOne({
  //         $and:[{
  //           $or:[{UserName:UserName},{Mobile:Mobile}]
  //         },{_id:{$ne:req.userId}}]
  //       });
  //       if(user){
  //         if(user.UserName){
  //           return res.status(409).send({responseCode:409,responseMessage:"UserName is existing with another account.^_^"});
  //         }else if(user.Mobile){
  //           return res.status(409).send({responseCode:409,responseMessage:"This Mobile number is registered with another account.^_^"});
  //         }
  //       }
  //       await functions.sendMail(userData.Email,"Your UserName and mobile has been changed.*_*.","<P>Enjoy</P>");
  //       const Data=await model.findByIdAndUpdate({_id:userData._id},{$set:{UserName:req.body.UserName,Mobile:req.body.Mobile}},{new:true});
  //       return res.status(200).send({responseCode:200,responseMessage:"UserName and Mobile has bes updated successfully.*_*",responseResult:Data});
  //     }
  //     else if(Email && !UserName&& Mobile){
  //       const user=await model.findOne({$and:[{$or:[{ Email:Email},{Mobile:Mobile}]},{_id:{$ne:req.userId}}]});
  //       if(user){
  //         if(user.Email){
  //           return res.status(409).send({responseCode:409,responseMessage:"Email is registered with another account.^_^"});
  //         }else if(user.Mobile){
  //           return res.status(409).send({responseCode:409,responseMessage:"This Mobile number is registered with another account.^_^"});
  //         }
  //       }
  //       await functions.sendMail(userData.Email,"Your Email and mobile has been changed.*_*.","<P>Enjoy</P>");
  //       const Data=await model.findByIdAndUpdate({_id:userData._id},{$set:{Email:req.body.Email,Mobile:req.body.Mobile}},{new:true});
  //       return res.status(200).send({responseCode:200,responseMessage:"UserName and Mobile has bes updated successfully.*_*",responseResult:Data});
  //     }
  //     else if(Email && UserName && !Mobile){
  //       const user=await model.findOne({$and:[{$or:[{ Email:Email},{UserName:UserName}]},{_id:{$ne:req.userId}}]});
  //       if(user){
  //         if (user.Email) {
  //           return res.status(409).send({responseCode:409,responseMessage:"Email is registered with another account.^_^"});

  //         } else if(user.UserName) {
  //           return res.status(409).send({responseCode:409,responseMessage:"UserName is existing with another account.^_^"});
  //         }
  //       }
  //       await functions.sendMail(userData.Email,"Your Email and UserName has been changed.*_*.","<P>Enjoy</P>");
  //       const Data=await model.findByIdAndUpdate({_id:userData._id},{$set:{Email:req.body.Email,UserName:req.body.UserName}},{new:true});
  //       return res.status(200).send({responseCode:200,responseMessage:"UserName and Mobile has bes updated successfully.*_*",responseResult:Data});

  //     }
  //     else if(!Email && !UserName && Mobile ){
  //       const user=await model.findOne({$and:[{Mobile:Mobile},{_id:{$ne:req.userId}}]});
  //       if(user){
  //         return res.status(409).send({responseCode:409,responseMessage:"Mobile is existing with another account.^_^"});
  //       }
  //       await functions.sendMail(userData.Email,"Your  Mobile has been changed.*_*.","<P>Enjoy</P>");
  //       const Data=await model.findByIdAndUpdate({_id:userData._id},{$set:{Mobile:req.body.Mobile}},{new:true})
  //       return res.status(200).send({responseCode:200,responseMessage:"Your Mobile has bes updated successfully.*_*",responseResult:Data});

  //     }else if(!Email && UserName && !Mobile){
  //       const user=await model.findOne({$and:[{UserName:UserName},{_id:{$ne:req.userId}}]});
  //       if(user){
  //         return res.status(409).send({responseCode:409,responseMessage:"UserName is existing with another account.^_^"});
  //       }
  //        functions.sendMail(userData.Email,"Your  UserName has been changed.*_*.","<P>Enjoy</P>");
  //       const Data=await model.findByIdAndUpdate({_id:userData._id},{$set:{UserName:req.body.UserName}},{new:true})
  //       return res.status(200).send({responseCode:200,responseMessage:"Your UserName has bes updated successfully.*_*",responseResult:Data});
  //     }
  //     else if(Email && !UserName&& !Mobile){
  //       const user=await model.findOne({$and:[{Email:Email,_id:{$ne:req.userId}}]});
  //       if(user){
  //         return res.status(409).send({responseCode:409,responseMessage:"Eamil is existing with another account.^_^"});
  //       }
  //       await functions.sendMail(userData.Email,"Your  Email has been changed.*_*.","<P>Enjoy</P>");
  //       const Data=await model.findByIdAndUpdate({_id:userData._id},{$set:{Email:req.body.Email}},{new:true})
  //       return res.status(200).send({responseCode:200,responseMessage:"Your Email has bes updated successfully.*_*",responseResult:Data});
  //     }else if(Password){
  //       const {newPassword,confirmNewPassword}=req.body;
  //       const matchPassword= bcrypt.compareSync(confirmNewPassword,10);
  //       if(!matchPassword){
  //         return res.send(401).send({responseCode:401,responseMessage:"Incorrect Password .!*_*"});
  //       }else{
  //         if(newPassword===confirmNewPassword){
  //           const hashPass=bcrypt.hashSync(newPassword,10);
  //           await model.findByIdAndUpdate({_id:userData._id},{$set:{Password:hashPass}});
  //           return res.status(200).send({responseCode:200,responseMessage:"Your Password Updated Successfully.*_*"});
  //         }else{
  //           return res.status(403).send({responseCode:403,responseMessage:"Your newPassword and confirmNewPassword must be same."})
  //         }
  //       }
  //     }else{
  //       const Data=await model.findByIdAndUpdate({_id:userData._id},{$set:req.body},{new:true});
  //       return res.status(200).send({responseCode:200,responseMessage:"Updated Successfully.*_*",responseResult:Data});
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     return res.status(500).send({
  //       responseCode: 500,
  //       responseMessage: "Something went wrong.*_*",
  //       error: error,
  //     });
  //   }
  // }
  // editProfile:async(req,res)=>{
  //   const userResult = await model.find({
  //     _id: req.userId,
  //     status: { $in: ["Active", "Blocked"] },
  //     userType: "User",
  //   });
  //   if (!userResult) {
  //     return res
  //       .status(404)
  //       .send({ responseCode: 404, responseMessage: "User not found " });
  //   } else {
  //     let result, updateMobile;
  //     const { Email, Mobile} = req.body;
  //    if (!Email && Mobile) {
  //           const update = await model.findByIdAndUpdate(
  //             { _id: userResult._id },
  //             { $set: req.body },
  //             { new: true }
  //           );
  //           return res.status(200).send({
  //             responseCode: 200,
  //             responseMessage: "Updated Successfull",
  //             resResult: update,
  //           });
  //         } else if (Email && !Mobile) {
  //           const query = {
  //             $and: [
  //               { Email: req.body.Email },
  //               { _id: { $ne: req.userId } },
  //               { status: { $ne: "Deleted" } },
  //             ],
  //           };
  //           result = await model.findOne(query);

  //           if (result) {
  //             return res.status(409).send({
  //               responseCode: 409,
  //               responseMessage: "Email is linked with another account",
  //             });
  //           }

  //           let { otp } = functions.generateOtp();

  //           await functions.sendMail(
  //             req.body.Email,
  //             "Email Updated",
  //             `<p>Your Email is updated</p>.
  //             Your otp is ${otp}`
  //           );
  //           updateEmail = await model.findByIdAndUpdate(
  //             { _id: userResult._id },
  //             { $set: { email: req.body.email, is_verified: true } },

  //             { new: true }
  //           );
  //           console.log(updateEmail);
  //           return res.status(200).send({
  //             responseCode: 200,
  //             responseMessage: "Please verify your Email",
  //           });
  //         } else if (!Email && Mobile) {
  //           const query = {
  //             $and: [
  //               { mobile: req.body.mobile },
  //               { _id: { $ne: req.userId } },
  //               { status: { $ne: "deleted" } },
  //             ],
  //           };
  //           result = await model.findOne(query);
  //           console.log(query);
  //           if (result) {
  //             return res.status(409).send({
  //               responseCode: 409,
  //               responseMessage: "Mobile is linked with another account",
  //             });
  //           }
  //           let { otp } = functions.generateOtp();
  //           await functions.sendMail(
  //             req.body.Email,
  //             "Email Updated",
  //             `<p>Your Email is updated</p>.Your otp is ${otp}`
  //           );
  //           updateMobile = await model.findByIdAndUpdate(
  //             { _id: userResult._id },
  //             { $set: req.body },
  //             { $unset: { is_verified: false } },
  //             { new: true }
  //           );

  //           return res.status(200).send({
  //             responseCode: 200,
  //             responseMessage: "Please verify your mail",
  //             resResult: updateMobile,
  //           });
  //         } else if (Email && Mobile) {
  //           const query = {
  //             $and: [
  //               { $or: [{ email: req.body.email }, { mobile: req.body.mobile }] },
  //               { _id: { $ne: userResult._id } },
  //               { status: { $ne: "deleted" } },
  //             ],
  //           };

  //           result = await model.findOne(query);

  //           if (result) {
  //             return res.status(409).send({
  //               responseCode: 409,
  //               responseMessage: "Email  is linked with another account",
  //             });
  //           } else {

  //             let otp = functions.generateOtp();
  //             await functions.sendMail(
  //               req.body.Email,
  //               "Email Updated",
  //               `<p>Your Email is updated</p>.
  //               Your otp is ${otp}`
  //             );

  //             updateData = await model.findOneAndUpdate(
  //               { _id: userResult._id },
  //               { $set: req.body },
  //               { new: true }
  //             );
  //             return res.status(200).send({
  //               responseCode: 200,
  //               responseMessage: "Please verify your email",
  //             });
  //           }
  //         }
  //       }
  //     }

  // editProfile: async (req, res) => {
  //   try {

  //     const userResult = await model.findOne({ _id: req.userId, status: { $in: ["active", "blocked"] }, userType: "user" });//to find user via token id and chech it that it will be active or blocked
  //     if (!userResult) {
  //       return res.status(404).send({ responseCode: 404, responseMessage: "User not found " });
  //     }
  //     else{
  //       let result,updateMobile

  //       const {email,mobile}=req.body;
  //       if(!email&&!mobile){
  //         const update=await model.findByIdAndUpdate({_id:userResult._id},{$set:req.body},{new:true});
  //         return res.status(200).send({responseCode:200,responseMessage:"Updated Successfull",resResult:update});
  //       }
  //       else if(email&&!mobile){
  //         const query={$and:[{email:req.body.email},{_id:{$ne:req.userId}},{status:{$ne:"deleted"}}]}
  //         result=await model.findOne(query);

  //         if(result){
  //           return res.status(409).send({responseCode:409,responseMessage:"Email is linked with another account"});
  //         }

  //          updateEmail=await model.findByIdAndUpdate({_id:userResult._id},{$set:req.body},{new:true});
  //           console.log(updateEmail);
  //           return res.status(200).send({responseCode:200,responseMessage:"Email Updated Successfull",resResult:updateEmail});

  //       }else if(!email&&mobile){
  //         const query={$and:[{mobile:req.body.mobile},{_id:{$ne:req.userId}},{status:{$ne:"deleted"}}]}
  //        result=await model.findOne(query)
  //        console.log(query);
  //         if(result){
  //           return res.status(409).send({responseCode:409,responseMessage:"Mobile is linked with another account"});
  //         }
  //          updateMobile=await model.findByIdAndUpdate({_id:userResult._id},{$set:req.body},{new:true});
  //           console.log(updateMobile);
  //           return res.status(200).send({responseCode:200,responseMessage:"Mobile updated successfully",resResult:updateMobile})

  //       }else if(email&& mobile){

  //         const query={$and:[{$or:[{email:req.body.email},{mobile:req.body.mobile}],},{_id:{$ne:userResult._id}},{status:{$ne:"deleted"}}]}

  //         result = await model.findOne(query)

  //         if(result){

  //          return res.status(409).send({responseCode:409,responseMessage:"Email  is linked with another account"});

  //         }else{ updateData= await model.findOneAndUpdate({_id:userResult._id},{$set:req.body},{new:true});
  //         return res.status(200).send({responseCode:200,responseMessage:"Email and mobile number updated succesfull",responseResult:updateData})
  //      }
  //         }
  //     }
  //   } catch (error) {
  //     return res.status(501).send({
  //       responseCode: 501,
  //       responseMessage: "semething went wrong",
  //       error: error,
  //     });

  //   }

  // },
  forgetPassword: async (req, res) => {
    try {
      const { Email } = req.body;
      if (!Email) {
        return res
          .status(400)
          .send({ responseCode: 400, responseMessage: "Email  is required." });
      }
      const userEmail = await model.findOne({ Email: Email });
      if (!userEmail) {
        return res.status(404).send({
          responseCode: 404,
          responceMessage: "user email not found.",
        });
      } else {
        const { otp, expirationTime } = functions.generateOtp();
        await functions.sendMail(
          req.body.Email,
          "Otp verification ",
          `<p> To reset your password.the otp is ${otp}</p>`
        );
        await model.findByIdAndUpdate(
          userEmail._id,
          { $set: { otp: otp, expirationTime: expirationTime } },
          { new: true }
        );
        return res.status(200).send({
          responseCode: 200,
          responseMessage: "otp has been successfully sent on ur mail",
        });
      }
    } catch (error) {
      return res.status(501).send({
        responseCode: 501,
        responceMessage: "Something went wrong..!",
        error: error,
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { Password, Email, ConfirmNewPassword } = req.body;
      if (!Email) {
        return res.status(400).send({
          responseCode: 400,
          responceMessage: "Eamil is required.",
        });
      }
      if (!Password || !ConfirmNewPassword) {
        return res.status(400).send({
          responseCode: 400,
          error: "Password and Confirm Password are required.",
        });
      }

      if (Password !== ConfirmNewPassword) {
        return res.status(400).send({
          responseCode: 400,
          error: "Password and Confirm Password do not match.",
        });
      }
      const user = await model.findOne({ Email: Email });
      if (!user) {
        return res
          .status(404)
          .send({ responseCode: 404, responceMessage: "User email not found" });
      }
      const otp = user.otp;
      if (otp === req.body.otp) {
        const currentTime = Date.now();
        if (currentTime > user.expirationTime) {
          return res.status(400).send({
            responseCode: 400,
            responseMessage: "Otp has been expierd",
          });
        } else {
          await model.updateOne(
            { Email: user.Email },
            {
              $unset: { otp: 1, expirationTime: 1 },
            }
          );
        }
      }
      const newPass = bcrypt.hashSync(Password, 10);
      await model.updateOne({ Email: Email }, { $set: { Password: newPass } });
      return res.status(200).json({
        message: "Password reset successfully.",
      });
    } catch (error) {
      res.status(501).send({
        responseCode: 501,
        responceMessage: "Something went wrong..!",
        error: error,
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { Password, Email, ConfirmNewPassword } = req.body;
      if (!Email) {
        return res.status(400).send({
          responseCode: 400,
          responceMessage: "Eamil is required.",
        });
      }
      if (!Password || !ConfirmNewPassword) {
        return res.status(400).send({
          responseCode: 400,
          error: "Password and Confirm Password are required.",
        });
      }

      if (Password !== ConfirmNewPassword) {
        return res.status(400).send({
          responseCode: 400,
          error: "Password and Confirm Password do not match.",
        });
      }
      const user = await model.findOne({ Email: Email });
      if (!user) {
        return res
          .status(404)
          .send({ responseCode: 404, responceMessage: "User email not found" });
      }
      const otp = user.otp;
      if (otp === req.body.otp) {
        const currentTime = Date.now();
        if (currentTime > user.expirationTime) {
          return res.status(400).send({
            responseCode: 400,
            responseMessage: "Otp has been expierd",
          });
        } else {
          await model.updateOne(
            { Email: user.Email },
            {
              $unset: { otp: 1, expirationTime: 1 },
            }
          );
        }
      }
      const newPass = bcrypt.hashSync(Password, 10);
      await model.updateOne({ Email: Email }, { $set: { Password: newPass } });
      return res.status(200).json({
        message: "Password reset successfully.",
      });
    } catch (error) {
      res.status(501).send({
        responseCode: 501,
        responceMessage: "Something went wrong..!",
        error: error,
      });
    }
  },

  editProfile: async (req, res) => {
    try {
      const userResult = await model.findOne({ _id: req.userId });

      if (!userResult) {
        return res
          .status(404)
          .send({ responseCode: 404, responseMessage: "User not found" });
      } else {
        const {
          Email,
          Mobile,
          UserName,
          Password,
          newPassword,
          ConfirmNewPassword,
        } = req.body;
        if (!Email && !Mobile && !UserName) {
          //case1
          if (Password) {
            const matchPassword = bcrypt.compareSync(
              Password,
              userResult.Password
            );
            if (matchPassword) {
              if (newPassword && ConfirmNewPassword) {
                if (newPassword === ConfirmNewPassword) {
                  const setPassword = bcrypt.hashSync(ConfirmNewPassword, 10);
                  const updatedData = await model.findOneAndUpdate(
                    { _id: userResult._id },
                    { $set: { Password: setPassword } },
                    { new: true }
                  );
                  return res.status(200).send({
                    responseCode: 200,
                    responseMessage: "Password updated successfully",
                  });
                } else {
                  return res.status(401).send({
                    responseCode: 401,
                    responseMessage:
                      "newPassword and confirmNewPassword must be the same",
                  });
                }
              } else if (newPassword && !ConfirmNewPassword) {
                return res.status(404).send({
                  responseCode: 404,
                  responseMessage: "ConfirmNew Password required",
                });
              } else if (!newPassword && ConfirmNewPassword) {
                return res.status(404).send({
                  responseCode: 404,
                  responseMessage: "newPassword required",
                });
              } else if (newPassword !== ConfirmNewPassword) {
                return res.status(404).send({
                  responseCode: 404,
                  responseMessage:
                    "newPassword and ConfirmNewPassword must be same",
                });
              }
            } else {
              return res.status(401).send({
                responseCode: 401,
                responseMessage: "Incorrect Password",
              });
            }
          } else {
            const update = await model.findOneAndUpdate(
              { _id: userResult._id },
              { $set: req.body },
              { new: true }
            );
            return res.status(200).send({
              responseCode: 200,
              responseMessage: "Updated successfully",
              resResult: update,
            });
          }
        } else if (Email && Mobile && UserName) {
          //case2
          const query = {
            $and: [
              {
                $or: [
                  { Email: req.body.Email },
                  { Mobile: req.body.Mobile },
                  { UserName: req.body.UserName },
                ],
              },
              { _id: { $ne: userResult._id } },
              { status: { $ne: "Deleted" } },
            ],
          };
          const result = await model.findOne(query);
          if (result) {
            if (result.Email === Email) {
              return res.status(409).send({
                responseCode: 409,
                responseMessage: "Email is registered with another account",
              });
            } else if (result.Mobile === Mobile) {
              return res.status(409).send({
                responseCode: 409,
                responseMessage:
                  "Mobile no. is registered with another account",
              });
            } else if (result.UserName === UserName) {
              return res.status(409).send({
                responseCode: 409,
                responseMessage:
                  "Username must be unique, this username is already in use",
              });
            }
          }
          await functions.sendMail(
            req.body.Email,
            "Updated data",
            `<p>Email, UserName, and Mobile updated successfully</p>`
          );

          const updatedData = await model.findOneAndUpdate(
            { _id: userResult._id },
            { $set: req.body },
            { new: true }
          );
          return res.status(200).send({
            responseCode: 200,
            responseMessage: "Email, UserName, and Mobile updated successfully",
            responseResult: updatedData,
          });
        } else if (Email && !Mobile && !UserName) {
          //case3
          const query = {
            $and: [
              { Email: req.body.Email },
              { _id: { $ne: userResult._id } },
              { status: { $ne: "Deleted" } },
            ],
          };
          const result = await model.findOne(query);
          if (result) {
            if (result.Email === Email) {
              return res.status(409).send({
                responseCode: 409,
                responseMessage: "Email is registered with another account",
              });
            }
          }
          await functions.sendMail(
            req.body.Email,
            "Updated data",
            `<p>Your email has been updated successfully</p>`
          );
          const updatedData = await model.findOneAndUpdate(
            { _id: userResult._id },
            { $set: { Email: req.body.Email } },
            { new: true }
          );
          return res.status(200).send({
            responseCode: 200,
            responseMessage: "Email updated successfully",
            responseResult: updatedData,
          });
        } else if (!Email && Mobile && !UserName) {
          //case3
          const query = {
            $and: [
              { Mobile: req.body.Mobile },
              { _id: { $ne: userResult._id } },
              { status: { $ne: "Deleted" } },
            ],
          };
          const result = await model.findOne(query);
          if (result) {
            if (result.Mobile === Mobile) {
              return res.status(409).send({
                responseCode: 409,
                responseMessage: "Email is registered with another account",
              });
            }
          }
          await functions.sendMail(
            req.userId.Email,
            "Updated data",
            `<p>Your email has been updated successfully</p>`
          );
          const updatedData = await model.findOneAndUpdate(
            { _id: userResult._id },
            { $set: { Mobile: req.body.Mobile } },
            { new: true }
          );
          return res.status(200).send({
            responseCode: 200,
            responseMessage: "Mobile updated successfully",
            responseResult: updatedData,
          });
        } else if (!Email && !Mobile && UserName) {
          //case4
          const query = {
            $and: [
              { UserName: req.body.UserName },
              { _id: { $ne: userResult._id } },
              { status: { $ne: "Deleted" } },
            ],
          };
          const result = await model.findOne(query);
          if (result) {
            if (result.UserName === UserName) {
              return res.status(409).send({
                responseCode: 409,
                responseMessage: "Email is registered with another account",
              });
            }
          }
          await functions.sendMail(
            req.userId.Email,
            "Updated data",
            `<p>Your email has been updated successfully</p>`
          );
          const updatedData = await model.findOneAndUpdate(
            { _id: userResult._id },
            { $set: { UserName: req.body.UserName } },
            { new: true }
          );
          return res.status(200).send({
            responseCode: 200,
            responseMessage: "Mobile updated successfully",
            responseResult: updatedData,
          });
        } else if (!Email && Mobile && UserName) {
          //case5
          const query = {
            $and: [
              { Mobile: req.body.Mobile },
              { UserName: req.body.UserName },
              { _id: { $ne: userResult._id } },
              { status: { $ne: "Deleted" } },
            ],
          };
          const result = await model.find(query);
          if (result.Mobile === Mobile) {
            return res.status(409).send({
              responseCode: 409,
              responseMessage:
                "Mobile no. is registered with other account.*_*",
            });
          } else if (result.UserName === UserName) {
            return res.status(409).send({
              responseCode: 409,
              responseMessage: "Username is registered with other account.*_*",
            });
          }
          await functions.sendMail(
            userResult.Email,
            "Updated data",
            `<p> Your Mobile no. and UserName updated successfully</p>`
          );
          const updatedData = await model.findOneAndUpdate(
            { _id: userResult._id },
            { $set: req.body },
            { new: true }
          );
          return res.status(200).send({
            responseCode: 200,
            responseMessage: "Mobile no. and UserName updated successfully.*_*",
            responseResult: updatedData,
          });
        } else if (Email && !Mobile && UserName) {
          //case6
          const query = {
            $and: [
              { Email: req.body.Email },
              { UserName: req.body.UserName },
              { _id: { $ne: userResult._id } },
              { status: { $ne: "Deleted" } },
            ],
          };
          const result = await model.find(query);
          if (result.Email === Email) {
            return res.status(409).send({
              responseCode: 409,
              responseMessage:
                "Mobile no. is registered with other account.*_*",
            });
          } else if (result.UserName === UserName) {
            return res.status(409).send({
              responseCode: 409,
              responseMessage: "Username is registered with other account.*_*",
            });
          }
          await functions.sendMail(
            req.body.Email,
            "Updated data",
            `<p> Your Mobile no. and UserName updated successfully</p>`
          );
          const updatedData = await model.findOneAndUpdate(
            { _id: userResult._id },
            { $set: req.body },
            { new: true }
          );
          return res.status(200).send({
            responseCode: 200,
            responseMessage: "Email and UserName updated successfully.*_*",
            responseResult: updatedData,
          });
        } else if (Email && Mobile && !UserName) {
          //case 7
          const query = {
            $and: [
              { Email: req.body.Email },
              { Mobile: req.body.Mobile },
              { _id: { $ne: userResult._id } },
              { status: { $ne: "Deleted" } },
            ],
          };
          const result = await model.find(query);
          if (result.Email === Email) {
            return res.status(409).send({
              responseCode: 409,
              responseMessage: "Email is registered with other account.*_*",
            });
          } else if (result.Mobile === Mobile) {
            return res.status(409).send({
              responseCode: 409,
              responseMessage: "Mobile is registered with other account.*_*",
            });
          }
          await functions.sendMail(
            req.body.Email,
            "Updated data",
            `<p> Your Mobile no. and Email updated successfully</p>`
          );
          const updatedData = await model.findOneAndUpdate(
            { _id: userResult._id },
            { $set: req.body },
            { new: true }
          );
          return res.status(200).send({
            responseCode: 200,
            responseMessage: "Mobile and UserName updated successfully.*_*",
            responseResult: updatedData,
          });
        } else if (!Email && Mobile && UserName) {
          const query = {
            $and: [
              { Mobile: req.body.Mobile },
              { UserName: req.body.UserName },
              { _id: { $ne: userResult._id } },
              { status: { $ne: "Deleted" } },
            ],
          };
          const result = await model.find(query);
          if (result.Mobile === Mobile) {
            return res.status(409).send({
              responseCode: 409,
              responseMessage:
                "Mobile no. is registered with other account.*_*",
            });
          } else if (result.UserName === UserName) {
            return res.status(409).send({
              responseCode: 409,
              responseMessage: "Username is registered with other account.*_*",
            });
          }
          await functions.sendMail(
            userResult.Email,
            "Updated data",
            `<p> Your Mobile no. and UserName updated successfully</p>`
          );
          const updatedData = await model.findOneAndUpdate(
            { _id: userResult._id },
            { $set: req.body },
            { new: true }
          );
          return res.status(200).send({
            responseCode: 200,
            responseMessage: "Mobile and UserName updated successfully.*_*",
            responseResult: updatedData,
          });
        }
      }
    } catch (error) {
      return res.status(501).send({
        responseCode: 501,
        responseMessage: "Something went wrong",
        responseResult: error,
      });
    }
  },

  productlist: async (req, res) => {
    try {
      const userId = req.userId;
      const user = await model.findOne({
        $and: [
          { _id: userId },
          { userType: "User" },
          { status: { $ne: "Deleted" } },
        ],
      });

      if (!user) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "User not found ,make sure you are loged in.*_*",
        });
      } else {
        const products = await productModel
          .find({})
          .populate({
            path: "categoryId",
            select: "-createdAt -updatedAt",
            populate: { path: "shopId", select: "-createdAt -updatedAt" },
          })
          .select("-createdAt -updatedAt");
        return res.status(200).send({
          responseCode: 200,
          responseMessage: "Your Product list is here.*_*",
          responseResult: products,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(501).send({
        responseCode: 501,
        responceMessage: "Something went wrong.*_*",
      });
    }
  },

  productField: async (req, res) => {
    try {
      const userId = req.userId;
      const user = await model.findOne({
        $and: [
          { _id: userId },
          { userType: "User" },
          { status: { $ne: "Deleted" } },
        ],
      });

      if (!user) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "User not found ,make sure you are loged in.*_*",
        });
      } else {
        // const products = await productModel.find({}).populate('categoryId',{'categoryName':1}).select("-createdAt -updatedAt");
        const products = await productModel.aggregate([
          {
            $lookup: {
              from: "categories",
              localField: "categoryId", // field in the orders collection
              foreignField: "_id", // field in the items collection
              as: "categoryDetails",
            },
          },
          //  { "$unwind": "$categoryDetails" },
          {
            $unwind: {
              path: "$categoryDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              createdAt: 0,
              updatedAt: 0,
              "categoryDetails.updatedAt": 0,
            },
          },
        ]);

        console.log("products==>>", products);
        return res.status(200).send({
          responseCode: 200,
          responseMessage: "Your Product list is here.*_*",
          responseResult: products,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(501).send({
        responseCode: 501,
        responceMessage: "Something went wrong.*_*",
      });
    }
  },

  productlistByAggregate: async (req, res) => {
    try {
      const admin = req.userId;
      const User = await model.findOne(
        { _id: admin },
        { userType: "User" },
        { status: { $ne: "Deleted" } }
      );
      if (!User) {
        return res
          .status(404)
          .send({ responseCode: 404, responceMessage: "User not found" });
      } else {
        const product = await productModel.aggregate([
          {
            $lookup: {
              from: "categories",
              localField: "categoryId",
              foreignField: "_id",
              as: "categoryDetail",
            },
          },
          { $unwind: "$categoryDetail" },
          {
            $project: {
              createdAt: 0,
              updatedAt: 0,
              "categoryDetail.updatedAt": 0,
              "categoryDetail.createdAt": 0,
            },
          },
        ]);
        return res
          .status(200)
          .send({
            responseCode: 200,
            responceMessage: "Data",
            responseResult: product,
          });
      }
    } catch (error) {
      console.log(error);
      return res
        .status(501)
        .send({
          responseCode: 501,
          responseMessage: "Something went wrong.",
          responseResult: error,
        });
    }
  },

  productlistByGeonear: async (req, res) => {
    try {
      const admin = req.userId;
      const User = await model.findOne(
        { _id: admin },
        { userType: "User" },
        { status: { $ne: "Deleted" } }
      );
      if (!User) {
        return res
          .status(404)
          .send({ responseCode: 404, responceMessage: "User not found" });
      } else {
        const product = await productModel.aggregate([
          {
            $geoNear: {
              near: { type: "Point", coordinates: [longitude, latitude] },
              maxDistance: 2000,
              spherical: true,
            },
          },
        ]);
        return res
          .status(200)
          .send({
            responseCode: 200,
            responceMessage: "Data",
            responseResult: product,
          });
      }
    } catch (error) {
      console.log(error);
      return res
        .status(501)
        .send({
          responseCode: 501,
          responseMessage: "Something went wrong.",
          responseResult: error,
        });
    }
  },
};
