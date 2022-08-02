const express = require('express');
const cors = require('cors');
require('./db/config');
const User = require('./db/User');
const Product = require('./db/Product');
const Jwt = require('jsonwebtoken');
const jwtKey = 'e-com';

const app = express();
app.use(express.json());
app.use(cors());

app.post('/register',async (req,resp) =>{
    const user =  new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;

    Jwt.sign({result},jwtKey,{expiresIn:'2h'},(err,token)=>{
        err ? resp.send({result:'something wrong'}) : resp.send({result,token:token});
    })
    
});

//login user
app.post('/login',async (req,resp) =>{
    if(req.body.email && req.body.password){
        let user = await User.findOne(req.body).select("-password");
        if(user){ 
            Jwt.sign({user},jwtKey,{expiresIn:'2h'},(err,token)=>{
                if(err) { resp.send({result:'something wrong'}); }
                else{ resp.send({user,token:token});}
            });
           
        }else{
             resp.send({result:'No User Found'});
        }

    }else{
        resp.send({result:'No User Found'});
    }
});

//add product
app.post('/add-product',verifyToken,async (req,resp)=>{
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result);
});
//get products
app.get('/products',verifyToken,async(req,resp)=>{
    let products =await Product.find();
    if(products.length > 0){
        resp.send(products);
    }else{
        resp.send({result:'No Product Found'})
    }
});

//delete product
app.delete('/product/:id',verifyToken,async (req,resp)=>{
    let result = await Product.deleteOne({_id:req.params.id});
    resp.send(result);
});
//get single product
app.get('/product/:id',verifyToken,async(req,resp)=>{
    let result = await Product.findOne({_id:req.params.id});
    if(result){
        resp.send(result);
    }else{
        resp.send({result:'No record found'});
    }
});

//update product
app.put('/product/:id',verifyToken,async (req,resp)=>{
    let result = await Product.updateOne(
        {_id:req.params.id},
        {$set:req.body}
    )
    resp.send(result);
});

//search product
app.get('/search/:key',verifyToken,async (req,resp)=>{
    let result = await Product.find({
        '$or':[
            {name:{$regex:req.params.key}},
            {company:{$regex:req.params.key}},
            {category:{$regex:req.params.key}},
        ]
    });
    resp.send(result);
});

//verify Token
function verifyToken(req,resp,next){
    const token = req.headers['authorization'];
    if(token){
        Jwt.verify(token,jwtKey,(err,valid)=>{
            if(err)
            {
                 resp.status(401).send({result:'provide valid token'});
            }else{
                next();
            }
        })
    }else{
        resp.status(401).send({result:'provide valid token'})
    }
}

app.listen(5000);