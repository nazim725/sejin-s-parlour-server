const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const app = express();
const port = process.env.PORT || 5000
const cors = require('cors')
require('dotenv').config();
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9s2cu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect()
        const database = client.db("habib-parlour");
        const serviceCollection = database.collection("services");
        const reviewCollection = database.collection("reviews");
        const orderCollection = database.collection("orders");
        const userCollection = database.collection("users");
        // post services
        app.post('/services', async (req, res) => {
            const service = req.body;
            console.log(service)
            const result = await serviceCollection.insertOne(service)
            res.json(result)

        });
        // post reviews
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            console.log(review)
            const result = await reviewCollection.insertOne(review)
            res.json(result)

        });
        // get services
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find({});
            const service = await cursor.toArray();
            res.send(service);
        });
        app.get('/orders', async (req, res) => {
            const cursor = orderCollection.find({});
            const order = await cursor.toArray();
            res.send(order);
        });


        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.json(result)
        });

        // get a single data frpm service collection
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            console.log('getting specific service', id);
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.json(service);
        });


        // save user to database/ this function is used for register form
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        // update user to database/ this function is used for google signing
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });


        // add admin
        app.put('/users/admin',async(req,res)=>{
            const user=req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: {role:'admin'} };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.json(result);
        })





    }
    finally {
        // await client.close()
    }

}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send("Running Sejin's Parlour Server")
});
app.listen(port, () => {
    console.log("Running Port:", port)
})