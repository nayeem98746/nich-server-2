
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient } = require('mongodb');
const SSLCommerzPayment = require('sslcommerz')
const ObjectId = require('mongodb').ObjectId;
const { v4: uuidv4 } = require('uuid');

const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.BD_PASS}@cluster0.t8ils.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

console.log(uri)

async function run(){
  // all data collection 

    try{
        await client.connect()
        const database = client.db('bike_portal')
        const exploreCollection = database.collection('explore')
        const explore2Collection = database.collection('explore2')
        const reviewCollection = database.collection('review')
        const usersCollection = database.collection('users')
        const orderCollection = database.collection('orders')
        // get api
        app.get('/explore', async(req, res)=> {
            const cursor = exploreCollection.find({})
            const explores =  await cursor.toArray()
            res.send(explores)
        })


        app.get('/')

        // post api 
        app.post('/explore', async(req, res)=> {
            const explore = req.body
            console.log('hit the api ' , explore)
            const result = await exploreCollection.insertOne(explore)
            console.log(result)
            res.json(result)
        })

          // explore2 get api
        app.get('/explore2', async(req, res)=> {
          const cursor = explore2Collection.find({})
          const explore2 = await cursor.toArray()
          res.send(explore2)
        })



        // post api
        app.post('/explore2' , async(req, res) => {
          const explore2 = req.body
          console.log('hit the 2 api', explore2)
          const result = await explore2Collection.insertOne(explore2)
          console.log(result)
          res.json(result)
        })
        app.get('/explore2/:id', async (req, res)=> {
          const id = req.params.id
          console.log('getting specific service' , id)
          const query ={_id: ObjectId(id)};
          const service = await explore2Collection.findOne(query);
          res.json(service)
       })

        // review post
        app.post('/addReview', async (req,res)=> {
          const review = req.body
          const result = await reviewCollection.insertOne(review)
          res.send(result)
        })
        // review get
        app.get('/addReview', async(req, res)=> {
          const cursor = reviewCollection.find({})
          const result =  await cursor.toArray()
          res.send(result)
      })
      
        // user post
        app.post('/users' , async (req, res)=> {
          const user = req.body
          const result = await usersCollection.insertOne(user)
          console.log(result)
          res.send(result)
        })

        app.put('/users/admin' , async (req, res)=> {
          const user = req.body
          console.log('put', user)
          const filter = {email: user.email};
          const updateDoc = {$set: { role:'admin' }};
          const result = await usersCollection.updateOne(filter,updateDoc)
          res.json(result)
        })
         app.get('/users/:email', async(req, res)=> {
          const email= req.params.email
          const query = {email: email}
          const user = await usersCollection.findOne(query)
          let isAdmin = false;
          if(user?.role === 'admin'){
            isAdmin = true;
          }
          res.json({admin : isAdmin})
        })

        //orders get
        app.get('/orders', async ( req , res)=> {
          let query = {}
          const email = req.query.email
          if(email){
            query = {email : email}

          }
          const cursor = orderCollection.find(query)
          const orders = await cursor.toArray()
          res.json(orders)
        })


        // orders api
        app.post('/orders' ,async (req,res)=> {
          const order = req.body
          // order.createdAt = new Data()
          const result = await orderCollection.insertOne(order)
          res.json(result)

        })
        // delete api
        app.delete('/orders/:id' , async(req, res)=> {
          const id = req.params.id
          const query ={_id:ObjectId(id)}
          const result = await orderCollection.deleteOne(query)
          res.json(result)
      })
        

      // payment initialization api
      app.post('/init',async(req, res) => {
        console.log(req.body);
        const data = {
            total_amount: req.body.total_amount,
            currency: 'BDT',
            tran_id: uuidv4(),
            success_url: 'https://still-everglades-27844.herokuapp.com/success',
            fail_url: 'https://still-everglades-27844.herokuapp.com/fail',
            cancel_url: 'https://still-everglades-27844.herokuapp.com/cancel',
            ipn_url: 'https://still-everglades-27844.herokuapp.com/ipn',
            shipping_method: 'Courier',
            paymentStatus:'pending',
            product_name: req.body.product_name,
            product_category: 'Electronic',
            product_image: req.body.product_image,
            product_profile: req.body.product_profile,
            cus_name: req.body.cus_name,
            cus_email: req.body.cus_email,
            cus_add1: 'Dhaka',
            cus_add2: 'Dhaka',
            cus_city: 'Dhaka',
            cus_state: 'Dhaka',
            cus_postcode: '1000',
            cus_country: 'Bangladesh',
            cus_phone: '01711111111',
            cus_fax: '01711111111',
            ship_name: 'Customer Name',
            ship_add1: 'Dhaka',
            ship_add2: 'Dhaka',
            ship_city: 'Dhaka',
            ship_state: 'Dhaka',
            ship_postcode: 1000,
            ship_country: 'Bangladesh',
            multi_card_name: 'mastercard',
            value_a: 'ref001_A',
            value_b: 'ref002_B',
            value_c: 'ref003_C',
            value_d: 'ref004_D'
        };
        console.log(data);
        // Insert Order data 
        const order = await orderCollection.insertOne(data)
        const sslcommer = new SSLCommerzPayment(process.env.Store_ID, process.env.Store_Password,false) //true for live default false for sandbox
        sslcommer.init(data).then(data => {
            //process the response that got from sslcommerz 
            //https://developer.sslcommerz.com/doc/v4/#returned-parameters
           if(data.GatewayPageURL){
            res.json(data.GatewayPageURL)
           }
           else{
             return res.status(400)
             massage:'Payment session faild'
           }
        });
    })
    app.post('/success' , async(req,res) => {
        console.log(req.body)
       const order = await orderCollection.updateOne({tran_id: req.body.tran_id},{
        $set:{
          val_id:req.body.val_id
        }
       })
        res.status(200).redirect(`https://niche-webside.web.app/success`)
    })
    app.post('/fail' , async(req,res) => {
        console.log(req.body)
        const order = await orderCollection.deleteOne({tran_id:req.body.tran_id})
        res.status(400).redirect(`https://niche-webside.web.app`)
    })
    app.post('/cancel' , async(req,res) => {
        console.log(req.body)
        res.status(200).redirect(`https://niche-webside.web.app`)
    })
    
// 
// https://niche-webside.web.app
    }
    finally{
        // await client.close()
        // ijsadfo

    }
}

run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello Kawasaki bike family!')
})

app.listen(port, () => {
  console.log(` listening at ${port}`)
})