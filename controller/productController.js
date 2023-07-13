const productModel = require('../models/product');
const categoryModel = require('../models/category')
const cloudinary = require("cloudinary").v2;
const userModel = require('../models/userModel');

cloudinary.config({
  cloud_name: "dultedeh8",
  api_key: "461991833927796",
  api_secret: "ruuF-4CFhQVh205cif_tQqNBBcA",
});


module.exports = {

  createProduct: async (req, res) => {
    try {
      const { productName, price, categoryId, productImage } = req.body;
      const Admin = await userModel.findOne({ _id: req.userId, userType: "Admin" });
      if (!Admin) {
        return res.status(404).send({ responseCode: 404, responseMessage: "The Admin not exist" });
      }
      else {
        const categoryData = await categoryModel.findOne({ _id: categoryId, status: "Active" })
        if (categoryData) {
          if (!productName && !price && !productImage) {
            return res.status(404).send({ responseCode: 404, responseMessage: "Fields are required" });
          }
          const uploadedImage = await cloudinary.uploader.upload(productImage);
          const imageUrl = uploadedImage.secure_url;

          const object = {
            productName: productName,
            price: price,
            categoryId: categoryId,
            productImage: imageUrl


          }
          const product = await productModel.create(object);


          return res.status(200).send({ responseCode: 200, responseMessage: "Product is created", responseResult: product });
        } else {
          return res.status(404).send({ responseCode: 404, responseMessage: "Category not exist" });
        }
      }

    } catch (error) {
      console.log(error)
      res.status(500).send({ responseCode: 500, responseMessage: 'Failed to create product' });
    }
  },
  getProduct: async (req, res) => {
    try {

      const userId = req.userId;
      const user = await userModel.findOne({ _id: userId, userType: "Admin"  });
      if (!user) {
        return res.status(404).send({ responseCode: 404, responseMessage: "Product not exist" });
      } else {
      
        const product = await productModel.find({}).populate("categoryId");
        console.log(product);
        res.status(200).send({ responseCode: 200, responseMessage: "Here is product list..*_*", responseResult: product });
      }
    } catch (error) {
      res.status(500).send({ responseCode: 500, responseMessage: 'Something went wrong' });

    }


  },

  deleteProduct: async (req, res) => {
    try {
      const admin = await userModel.findOne({
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
        const deleteData = await productModel.findByIdAndDelete({ _id: _id }, { new: true });
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

  updateProduct: async (req, res) => {
    try {
      const admin = await userModel.findOne({
        _id: req.userId,
        userType: "Admin",
      });

      if (!admin) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "Admin Account does not exist",
        });
      } else {
        const data = req.params._id;
        const { productName, price, productImage } = req.body;
        if (productName || price || productImage) {
          if (productName) {
            const product = await productModel.findByIdAndUpdate({ _id: data }, { $set: { productName: productName } }, { new: true });
            return res.status(200).send({ responseCode: 200, responseMessage: "ProductName is updated Successfully", responseResult: product });
          } else if (price) {
            const product = await productModel.findByIdAndUpdate({ _id: data }, { $set: { price: price } }, { new: true });
            return res.status(200).send({ responseCode: 200, responseMessage: "ProductName is updated Successfully", responseResult: product });
          } else if (productImage) {
            const productImage = req.body.productImage;
            const result =await cloudinary.uploader.upload(productImage);
            const imageUrl = result.secure_url;
            const product = await productModel.findByIdAndUpdate({ _id: data }, { $set: { productImage: imageUrl } }, { new: true });
            return res.status(200).send({ responseCode: 200, responseMessage: "Your profile image updated successfull.*_*", responseResult: product });
          }else if(productName&&price&&productImage){
            const query={$and:[{$or:[{productName:productName},{price:price},{productImage:productImage}]},{status:"Active"}]}
            if(query){
              const productImage=req.body.productImage;
              const result=await cloudinary.uploader.upload(productImage);
              const Url=result.secure_url;
              const data=await productModel.findOneAndUpdate({_id:data},{$set:{productName: productName ,price: price, productImage: Url }});
              return res.status(200).send({ responseCode: 200, responseMessage: "Your profile image updated successfull.*_*", responseResult: product });            
            }
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

  }
}