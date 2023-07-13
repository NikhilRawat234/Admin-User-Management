const cloudinary=require('cloudinary').v2
const model = require("../models/adminShop");
const umodel = require("../models/userModel");
const functions = require("../common/commonFunction");
const secretkey = "charu";
const jwt = require("jsonwebtoken");

const bcrypt = require("bcrypt");
const { query } = require("express");
cloudinary.config({
  cloud_name: "dultedeh8",
  api_key: "461991833927796",
  api_secret: "ruuF-4CFhQVh205cif_tQqNBBcA",
});
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
      const Admin = await umodel.findOne({
        $and: [{ Email: Email }, { userType: "Admin" }],
      });

      if (!Admin) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "Sorry, Mail not found..*_*",
        });
      } else {
        const matchPassword = bcrypt.compareSync(Password, Admin.Password);

        if (matchPassword) {
          const token = jwt.sign({ _id: Admin._id }, secretkey, {
            expiresIn: "24h",
          });
          return res.status(200).send({
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
  createShop: async (req, res) => {
    try {
      const { shopName, city, coordinates} = req.body;
      const { latitude, longitude } = coordinates; //Directly use variables to acces the value of coordinates object
      const admin = await umodel.findOne({
        _id: req.userId,
        userType: "Admin",
      });

      if (!admin) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "Account does not exist",
        });
      }

      const shopImage=req.body.shopImage;
      const image= await cloudinary.uploader.upload(shopImage);
      const imageUrl=image.secure_url;
      const newShop = {
        shopName: shopName,
        city: city,
        coordinates: {
          latitude: latitude,
          longitude: longitude,
        },
        shopImage:imageUrl
      };
      const result = await model.create(newShop);
      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Your Shop is created...",
        result,
      });
    } catch (error) {
      return res.status(501).send({
        responseCode: 501,
        responseMessage: "Something went wrong..!",
        error,
      });
    }
  },
  deleteShop: async (req, res) => {
    try {
      const admin = await umodel.findOne({
        _id: req.userId,
        userType: "Admin",
      });

      if (!admin) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "Admin Account does not exist",
        });
      } else {
        const _id = req.params._id;
        const deleteData = await model.findByIdAndDelete({_id:_id});
        return res
          .status(200)
          .send({
            responseCode: 200,
            responseMessage: "Data is deleted",
            responseResult: deleteData,
          });
      }
    } catch (error) {
      console.log(error);
      return res.status(501).send({
        responseCode: 501,
        responseMessage: "Something went wrong..!",
        error,
      });
    }
  },
  updateShop: async (req, res) => {
    try {
      const admin = await umodel.findOne({
        _id: req.userId,
        userType: "Admin",
      });
      if (!admin) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "Account does not exist",
        });
      } else {
        const { _id, shopName, city } = req.body;
        const shop = await model.findOne( {_id:_id },{ status: { $ne: "Deleted" } });
        if (!shop) {
          return res
            .status(404)
            .send({ responseCode: 404, responseMessage: "Shop not found" });
        } else {
            if(shopName&&!city){
              const query= {$and:[{shopName:shopName},{status:"Active"}]}
              if(query){
                const data=await model.findOneAndUpdate({_id:shop},{$set:req.body},{new:true});
                return res.status(200).send({responseCode:200,responseMessage:"Your Shop name is up to date.*_*",responseResult:data});
              }else{
                return res.status(404).send({
                  responseCode: 404,
                  responseMessage: "shopName not exist",
                });
              }
            }else if(!shopName&& city){
              const query= {$and:[{city:city},{status:"Active"}]}
              if(query){
                const data=await model.findOneAndUpdate({_id:shop},{$set:req.body},{new:true});
                return res.status(200).send({responseCode:200,responseMessage:"Your city is up to date.*_*",responseResult:data});
              }else{
                return res.status(404).send({
                  responseCode: 404,
                  responseMessage: "Shop city not exist",
                });
              }
            }else if(shopName && city){
              const query={$and:[{$or:[{shopName:shopName},{city:city}]},{status:"Active"}]}
              if(query){
                const data=await model.findOneAndUpdate({_id:shop},{$set:req.body},{new:true});
                return res.status(200).send({responseCode:200,responseMessage:"Your shopName and city is up to date.*_*",responseResult:data});
              }else{
                return res.status(404).send({
                  responseCode: 404,
                  responseMessage: "Shop city not exist",
                });
              }
            }else if(!shopName&&!city){  
              
              const data =await model.findOneAndUpdate({_id:shop},{$set:req.body},{new:true});     
              return res.status(200).send({responseCode:200,responseMessage:"Your data is up to date.*_*",responseResult:data});

            }else if(shopImage){
              const shopImage=req.body.shopImage;
              const image=await cloudinary.uploader.upload(shopImage);
              const shopUrl=image.secure_url;
              const result=await model.findOneAndUpdate({_id:shop},{$set:{shopImage:shopUrl}},{new:true});
              return res.status(200).send({responseCode:200,responseMessage:"Your shopImage updated successfully.*_*",responseResult:result});


            }
        }
      }
    } catch (error) {
      return res.status(501).send({
        responseCode: 501,
        responseMessage: "Something went wrong..!",
        error,
      });
    }
  },
  getShop: async (req, res) => {
    try {
      const admin = await umodel.findOne({
        _id: req.userId,
        userType: "Admin",
      });
      if (!admin) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "Admin Account does not exist",
        });
      } else {
        const shopdata = await model.find({});
        if (!shopdata) {
          return res.status(404).send({
            responseCode: 404,
            responseMessage: "Shop not found..*_*",
          });
        }
        return res
          .status(200)
          .send({
            responseCode: 200,
            responseMessage: "All Shops are here..*_*",
            responseResult: shopdata,
          });
      }
    } catch (error) {
      return res
        .status(501)
        .send({
          responseCode: 501,
          responseMessage: "Something went wrong",
          responseResult: error,
        });
    }
  },

  getShopById: async (req, res) => {
    try {
      const admin = await umodel.findOne({
        _id: req.userId,
        userType: "Admin",
      });
      if (!admin) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "Admin Account does not exist",
        });
      } else {
        const shopId = req.params._id;
        const shopData = await model.findOne({ _id: shopId });
        console.log(shopData);
        if (!shopData) {
          return res.status(404).send({
            responseCode: 404,
            responseMessage: "Shop not found..*_*",
          });
        }
        return res
          .status(200)
          .send({
            responseCode: 200,
            responseMessage: "All Shops are here..*_*",
            responseResult: shopData,
          });

      }
    } catch (error) {
      console.log(error);
      return res
        .status(501)
        .send({
          responseCode: 501,
          responseMessage: "Something went wrong",
          responseResult: error,
        });
    }
  },
};
