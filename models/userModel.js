const mongoose = require("mongoose");
const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');


const userSchema = Schema({
    FirstName: {
        type: String
    },
    LastName: {
        type: String
    },
    Email: {
        type: String,
        require: true,
        unique: true,

    },
    Mobile: {
        type: Number,
        require: true,
        maxlength: 15,
        minlength: 10,
        match: /^[0-9]{10,12}$/,
    },
    Countrycode: {
        type: Number,
        minlength: 2,
        maxlength: 3,

    },
    UserName: {
        type: String,
        unique: true
    },
    Password: {
        type: String,
        required: true,
        minlength: 8,
    },
    Address: {
        type: String
    },
    DateOfBirth: {
        type: Date,

    },
    otp: {
        type: String,

    },
    is_verified: {
        type: Boolean,
        default: 0
    },
    is_verifyEmail: {
        type: Boolean,
        default: 0
    },
    userType: {
        type: String,
        enum: ['User', 'Admin'],
        default: "User"
    },
    secretKey: {
        type: String,

    },
    status: {
        type: String,
        enum: ['Active', 'Blocked', 'Deleted'],
        default: 'Active'
    },
    expirationTime: {
        type: Date
    }

}, { timestamps: true });
userSchema.pre('save', function (next) {
    const lastDigits = this.Mobile.toString().slice(-4);
    this.UserName = `${this.FirstName.toLowerCase()}${lastDigits}`;
    next();
});

module.exports = model('userNode', userSchema);


const Admin = async () => {
    try {
        let userData = await model('userNode', userSchema).find({
            userType: 'Admin'
        });
        if (userData.length > 0) {
            console.log("Admin is Present on DataBase..*_*!");
        } else {
            let obj = {
                FirstName: "Hukum",
                LastName: "Singh Yadav",
                Email: "yadavcharu594@gmail.com",
                Mobile: 8382802956,
                Countrycode: +91,
                UserName: "hukum2956",
                Password: bcrypt.hashSync("hukum@123", 10),
                Address: "Saidpur Ghazipur",
                DateOfBirth: "1976-06-09",
                userType: 'Admin',
                is_verified: true,
                is_verifyEmail: true,
                status: 'Active'

            }

            await model('userNode', userSchema).create(obj);
            console.log('Admin Created Successfull..^_^!', obj);
        }

    } catch (error) {
        console.log(error);
    }
}
Admin();



