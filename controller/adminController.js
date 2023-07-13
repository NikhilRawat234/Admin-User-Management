const model = require("../models/userModel");
const jwt = require("jsonwebtoken");
const secretKey = "charu";
const bcrypt=require('bcrypt');
const { resetPassword } = require("./userController");

module.exports = {
  adminLogin: async (req, res) => {
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
          responceMessage: "Email and password are required.",
        });
      }
      const Admin = await model.findOne({
        $and: [{ Email: Email }, { userType: "Admin" }],
      });

      if (!Admin) {
        return res
          .status(404)
          .send({
            responseCode: 404,
            responseMessage: "Sorry, Mail not found..*_*",
          });
      } else {
        const matchPassword = bcrypt.compareSync(Password, Admin.Password);

        if (matchPassword) {
          const token = jwt.sign({ _id: Admin._id }, secretKey, {
            expiresIn: "24h",
          });
          return res
            .status(200)
            .send({
              responseCode: 200,
              responceMessage: "login successful!.*_* ",
              token,
            });
        } else {
          return res
            .status(401)
            .send({ responseCode: 401, responseMessage: "Incorrect password" });
        }
      }
    } catch (error) {
      console.log(error);
      return res
        .status(501)
        .send({ responseCode: 501, responseMessage: "Something went wrong." });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { Password, newPassword, confirmNewPassword } = req.body;
      const admin = req.userId;
      const Admin = await model.findOne({_id:admin});
     console.log(Admin);
      if (!Admin) {
        return res.status(404).send({ responseCode: 404, responseMessage: "Admin not exist.*_*" });
      }
      if (!Password) {
        return res.status(404).send({ responseCode: 404, responseMessage: "Password required*..*_*" });
      } else {
        if (!newPassword && !confirmNewPassword) {
          return res.status(404).send({ responseCode: 404, responseMessage: "NewPassword and confirmNewPassword required*..*_*" });
        } else if (!newPassword && confirmNewPassword) {
          return res.status(404).send({ responseCode: 404, responseMessage: "NewPassword is required*..*_*" });
        } else if (newPassword && !confirmNewPassword) {
          return res.status(404).send({ responseCode: 404, responseMessage: "confirmNewPassword is required*..*_*" });
        } else {
          const matchPassword = bcrypt.compareSync(Password, Admin.Password);
          if (matchPassword) {
            if (newPassword !== confirmNewPassword) {
              return res.status(404).send({ responseCode: 404, responseMessage: "NewPassword and confirmNewPassword must be same..*_*" });
            } else {
              const setPassword = bcrypt.hashSync(confirmNewPassword, 10);
              const updatedData = await model.findOneAndUpdate(
                { _id: Admin._id },
                { $set: { Password: setPassword } },
                { new: true }
              );
              return res.status(200).send({
                responseCode: 200,
                responseMessage: "Password updated successfully",
                responseResult: updatedData
              });
            }
          } else {
            return res.status(401).send({ responseCode: 401, responseMessage: "Incorrect Password.*_*" });
          }
        }
      }
    } catch (error) {
      res.status(501).send({
        responseCode: 501,
        responceMessage: "Something went wrong..!",
        error: error,
      });
    }
  },

  adminForgetPswrd:async(req,res)=>{
    try {
      const {Email}=req.body;
      const adminEmail=await model.findOne({Email:Email})
      if(!adminEmail){
        return res.status(404).send({responseCode:404,responseMessage:"Email is required"});
      }else{
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
      res.status(501).send({
        responseCode: 501,
        responceMessage: "Something went wrong..!",
        error: error,
      });
    }
  },
  resetPassword:async(req,res)=>{
    try {
      const { Password, newPassword, confirmNewPassword } = req.body;
      const admin = req.userId;
      const Admin = await model.findOne({_id:admin});
     
      if (!Admin) {
        return res.status(404).send({ responseCode: 404, responseMessage: "Admin not exist.*_*" });
      }
      if (!Password) {
        return res.status(404).send({ responseCode: 404, responseMessage: "Password required*..*_*" });
      } else {
        if (!newPassword && !confirmNewPassword) {
          return res.status(404).send({ responseCode: 404, responseMessage: "NewPassword and confirmNewPassword required*..*_*" });
        } else if (!newPassword && confirmNewPassword) {
          return res.status(404).send({ responseCode: 404, responseMessage: "NewPassword is required*..*_*" });
        } else if (newPassword && !confirmNewPassword) {
          return res.status(404).send({ responseCode: 404, responseMessage: "confirmNewPassword is required*..*_*" });
        }
    }const otp = Admin.otp;
    if (otp === req.body.otp) {
      const currentTime = Date.now();
      if (currentTime > Admin.expirationTime) {
        return res.status(400).send({
          responseCode: 400,
          responseMessage: "Otp has been expierd",
        });
      } else {
        await model.updateOne(
          { Email: Admin.Email },
          {
            $unset: { otp: 1, expirationTime: 1 },
          }
        );
      }
    }
    const newPass = bcrypt.hashSync(Password, 10);
    await model.updateOne({ Email: Admin.Email }, { $set: { Password: newPass } });
    return res.status(200).json({
      message: "Password reset successfully.",
    });
    } catch (error) {
      return res.status(501).send({responseCode:501,responseMessage:"Something went wrong..*_*"});
    }
   
}
}
