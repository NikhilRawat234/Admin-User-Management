const model = require('../models/adminShop');
const categoryModel = require('../models/category');
const userModel = require('../models/userModel')
module.exports = {
    createCategory: async (req, res) => {
        try {
            
            const { categoryName, shopId } = req.body;
            const Admin = await userModel.findOne({ _id: req.userId }, { userType: "Admin" });
            if (Admin) {
                const shop = await model.findOne({ _id: shopId });
                if (!shop) {
                    return res.status(404).send({ responseCode: 404, responseMessage: "The shop not exist" });
                } else {
                    if (categoryName) {
                        const newCategory = { categoryName: categoryName, shopId: shopId };
                        const data = await categoryModel.create(newCategory);
                        return res.status(200).send({ responseCode: 200, responseMessage: "Category is created.", responseResult: data });
                    } else {
                        return res.status(404).send({ responseCode: 404, responseMessage: "categoryName is required" });

                    }
                }

            } else { return res.status(404).send({ responseCode: 404, responseMessage: "The Admin not exist" }); }
        } catch (error) {
            console.log(error)
            res.status(500).send({ responseCode: 500, responseMessage: 'Failed to create category' });
        }
    },

    getCategory: async (req, res) => {
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
                const shopdata = await model.find({});
                if (!shopdata) {
                    return res.status(404).send({
                        responseCode: 404,
                        responseMessage: "Category not found..*_*",
                    });
                }
                return res
                    .status(200)
                    .send({
                        responseCode: 200,
                        responseMessage: "All Category are here..*_*",
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

    getCategoryById: async (req, res) => {
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

    deleteCategory: async (req, res) => {
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
                const deleteData = await categoryModel.findByIdAndDelete({_id:_id });
                
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

    updateCategory: async (req, res) => {
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
                const categoryName=req.body;
                const categoryId = req.params._id;
                const data = await categoryModel.find({ _id: categoryId }, { status: "Active" });
                if (data) {
                    if (categoryName) {
                        const result = await categoryModel.findOneAndUpdate({ _id: categoryId }, { $set: {categoryName: req.body.categoryName } }, { new: true });
                        return res.status(200).send({ responseCode: 200, responseMessage: "Your categoryName updated.*_*", responseResult: result });
                    } else {
                        return res.status(404).send({
                            responseCode: 404,
                            responseMessage: "categoryname is not found",
                        });
                    }
                } else {
                    return res.status(404).send({
                        responseCode: 404,
                        responseMessage: "data is not found",
                    });
                }
            }
        } catch (error) {
            console.log(error);
            return res.status(501).send({
                responseCode: 501,
                responseMessage: "Something went wrong..!",
                error,
            });
        }
    }
}
