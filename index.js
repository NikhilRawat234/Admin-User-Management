const express=require('express');
const userRouter = require('./routers/userRouter');
require('./connections/dbConnection');
const staticRouter=require('./routers/staticRouter');
const shopRouter=require('./routers/shopRouter');
const adminRouter=require('./routers/adminRouter');
const categoryRouter=require('./routers/categoryRouter');
const productRouter=require('./routers/ProductRouter');
const fileupload = require('express-fileupload');
const app=express();
const PORT=8000;
app.use(fileupload({useTempFiles: true}));


app.use(express.json());
app.use('/api',userRouter);
app.use('/static',staticRouter);
app.use('/admin',adminRouter);
app.use('/shop',shopRouter);
app.use('/category',categoryRouter);
app.use('/product',productRouter);
app.listen(PORT,()=>{
console.log(`Server listening on port.....${PORT} *_*`);
})