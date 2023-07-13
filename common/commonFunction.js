const model = require("../models/userModel");
const nodemailer = require("nodemailer");
const otp = require("otp-generator");
const jwt = require("jsonwebtoken");
const secretkey = "charu";

module.exports={
    validation: async (reqBody) => {
        const requireFields = [
          "FirstName",
          "LastName",
          "Email",
          "Mobile",
          "Countrycode",
          "Password",
          "Address",
          "DateOfBirth",
        ];
        const missingFields = [];
        requireFields.forEach((field) => {
          if (!reqBody[field]) {
            missingFields.push(field);
            return missingFields;
          }
        });
        return missingFields;
      },
      sendMail: async (email, subject, html) => {
        try {
          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
              user: "charulata.yadav@indicchain.com",
              pass: "ovscmoyqdyhbfhdz",
            },
          });
          const mailOptions = {
            from: "charulata.yadav@indicchain.com",
            to: email,
            subject: subject,
            html: html,
          };
    
          let send = await transporter.sendMail(mailOptions);
    
          return send;
        } catch (error) {
          return error;
        }
      },
      generateOtp: () => {
        const otp = Math.floor(Math.random() * 900000 + 100000).toString(); 
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 3); 
        return { otp, expirationTime };
      },
      auth: async (req, res, next) => {
        
        try {  
          const token = req.headers["authorization"];
          
         
          if(!token){
            return res.status(404).send({responseCode:404,responseMessage:"Access Denied!" });
          }else
        {const user=await model.find({_id:token._id},{status:"Active"});
          if(user){
            jwt.verify(token, secretkey, (error, result) => {
              if (error) {
          
                res
                  .status(501)
                .send({
                   responseCode: 501,
                    responseMessage: "Something went wrong!.....*_*",
                  });
              } else if( result){
                req.userId = result._id;
                
                return next();
          }})
          }    
        }          
        } catch (error) {
          
          return res
            .status(501)
            .send({
              responseCode: 501,
              responseMessage: "Something went wrong",
              error: error.message,
            }); 
        }
        },

      //  generateUserName:async(req,res)=> {
      //   try {
      //     const lastDigits = document.Mobile.toString().slice(-4);
      //     return `${document.FirstName.toLowerCase()}${lastDigits}`;
        
      //   } catch (error) {
      //     console.log(error);
      //     return res.status(501).send({responseCode:501,responseMessage:"Something went wrong",})
      //   }
      // }  
        
}