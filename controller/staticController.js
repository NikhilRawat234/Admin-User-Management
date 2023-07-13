const bcrypt = require("bcrypt");
const staticModel = require("../models/staticModel");
const model = require("../models/userModel");
const jwt = require("jsonwebtoken");
const secretKey = "charu";
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
  updateStaticContent: async (req, res) => {
    try {
      const staticData = await staticModel.find({ type: req.body.type });
      if (!staticData) {
        return res
          .status(404)
          .send({
            responseCode: 404,
            responseMessage: "This type content not present in database.",
          });
      } else {
        const content = await staticModel.updateOne({
          description: req.body.description,
        });
        return res
          .status(200)
          .send({
            responseCode: 200,
            responseMessage: "Description Updated Successfully.",
            responseResult: content,
          });
      }
    } catch (error) {
      return res
        .status(501)
        .send({ responseCode: 501, responseMessage: "Something went wrong." });
    }
  },

  getAllStaticData: async (req, res) => {
    try {
      const type = req.params;
      const staticData = await staticModel.find(type);
      return res
        .status(200)
        .send({
          responseCode: 200,
          responseMessage: "Here the Static Content",
          responseResult: staticData,
        });
    } catch (error) {
      return res
        .status(501)
        .send({
          responseCode: 501,
          responseMessage: "Somthing went wrong",
          responseResult: error,
        });
    }
  },
  getStaticData: async (req, res) => {
    try {
      const staticList = await staticModel.find();
      if (!staticList) {
        return res
          .status(404)
          .send({
            responseCode: 404,
            responseMessage: "No content present in Db *_*",
          });
      }
      return res
        .status(200)
        .send({
          responseCode: 200,
          responseMessage: "All Static conten*_*",
          responseResult: staticList,
        });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send({
          responseCode: 500,
          responseMessage: "Something went wrong",
          responseResult: error,
        });
    }
  },
 
  editStatic: async (req, res) => {
    try {
      const adminId = req.userId;
      const user = await model.findOne({ _id: adminId });
      if (user) {
        const staticId = req.params._id;
        const staticData = await staticModel.findOne({ _id: staticId});
        console.log(staticData);
        if (!staticData) {
          return res
            .status(404)
            .send({
              responseCode: 404,
              responseMessage: "This _id type content not present in db.*_*",
            });
        } else {
          if (staticData.type  === req.body.type) {
            const content = await staticModel.updateOne({_id:staticId},{
              description: req.body.description,
            });
            return res
              .status(200)
              .send({
                responseCode: 200,
                responseMessage: "Description Updated Successfully. ",
                responseResult: content,
              });
          } else if (staticData.type === req.body.type) {
            const content = await staticModel.updateOne({_id:staticId},{
              title: req.body.title,
            });
            return res
              .status(200)
              .send({
                responseCode: 200,
                responseMessage: "Title Updated Successfully.",
                responseResult: content,
              });
          } else if (staticData.title === req.body.title) {
            const content = await staticModel.updateOne({_id:staticId},{
              type: req.body.type,
            });
            return res
              .status(200)
              .send({
                responseCode: 200,
                responseMessage: "Type Updated Successfully.",
                responseResult: content,
              });
         }
         }
      }
      else{
        return res.status(404).send({ responseCode: 404, responseMessage: "User not found." });
      }
    } catch (error) {
      return res
        .status(501)
        .send({ responseCode: 501, responseMessage: "Something went wrong." });
    }
  },

};
