const mongoose = require('mongoose');

const url = "mongodb://127.0.0.1:27017/nodeMilestoneM1";

// mongoose.connect(url,{
//     useNewUrlParser: true,
//         useUnifiedTopology: true,
// }).then(()=>{
//     console.log("Data Base connected.....*_*");
// }).catch(err=>{
//     console.log(err);
// })

(async () => {
    try {
        mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Data Base connected.....*_*");
    } catch (error) {
        console.log(err);
    }
}
)();