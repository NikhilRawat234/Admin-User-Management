const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");
const staticSchema = Schema({
  type: {
    type: String,
    require: true,
  },
  title: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    require: true,
  },
  status: {
    type: String,
    default: "Active",
  },
});
module.exports = model("staticContent", staticSchema);

const static = async () => {
  let staticData = await model("staticContent", staticSchema).find({
    // userType:{$in:'admin'}
  });
  if (staticData.length !== 0) {
    console.log("Static Content already present in db *_*");
  } else {
    let statiContent1 = {
      type: "Contact",
      title: "Contact US",
      description: "email=charuyadav@indicchain.com, 'mobile':5965595992",

      status: "Active",
    };
    let statiContent2 = {
      type: "About",
      title: "About us",
      description:
        "Mobiloitte is a next-generation Blockchain and Metaverse development company that can empower and transform businesses in today's dynamic market. Reinforce your business with the latest technological Solutions: Blockchain, Metaverse, Games, AI/ML, IoT, Cloud, DevOps, Mobile Apps, and Web Apps.",
      status: "Active",
    };
    let statiContent3 = {
      type: "T&C",
      title: "Terms and COndition",
      description:
        "THE AGREEMENT:   The use of this website and services on this website provided by Mobiloitte Technologies (hereinafter referred to as “Owner”) are subject to the following Terms & Conditions (hereinafter the “Terms of Service”), all parts and sub-parts of which are specifically incorporated by reference here. Following are the Terms of Service governing your use of www.mobiloitte.com (the “Website”), all pages on the Website and any services provided by or on this Website (“Services”). By accessing either directly or through a hyperlink, the Website, and/ or purchasing something from us, you engage in our “Service” and agree to be bound by the Terms of Service including those additional terms and conditions and policies referenced herein and/or available by hyperlink. These Terms of Service apply to all users of the site, including without limitation vendors, buyers, customers, merchants, browsers, and/ or contributors of content.",
      status: "Active",
    };
    let statiContent4 = {
      type: "Privacy",
      title: "Privacy Policy",
      description:
        "a)  We collect information primarily to provide better services to all of our customers. b)  When you visit our Site, some information is automatically collected. This may include information such as the Operating Systems (OS) running on your device, Internet Protocol (IP) address, access times, browser type, and language, and the website you visited before our Site. We also collect information about how you use Our products or services.c)  We automatically collect purchase or content use history, which we some",
      status: "Active",
    };
    const Contents = [
      statiContent1,
      statiContent2,
      statiContent3,
      statiContent4,
    ];

    await model("staticContent", staticSchema).create(Contents);
    console.log("static content created successfully");
  }
};
static();
const Static = async (req, res) => {
  try {
    let staticData = await model("staticContent", staticSchema).find(
      { $in: { userType: "admin" } },
      (err, res) => {
        if (err) {
          console.log("content not found");
        } else if (res) {
          console.log("Content already exist. *_*");
          return res
            .status(409)
            .send({
              responseCode: 409,
              responseMessage: "Content already exist. *_*",
            });
        } else {

          mongoose
            .model("staticContent", staticSchema)
            .create(
              statiContent1,
              statiContent3,
              statiContent4,).then((result) => {
                //                 console.log("created");
              })

        } 
      }
    );
  } catch (error) {
    return error;
  }
};
Static();
