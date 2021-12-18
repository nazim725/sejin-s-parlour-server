const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const app = express();
const port = process.env.PORT || 5000
const cors = require('cors')
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET)
app.use(cors());
app.use(express.json());

app.use(function (req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
})



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
        // post orders
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.json(result)
        });

        // get services
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find({});
            const service = await cursor.toArray();
            res.send(service);
        });
        // get reviews
        app.get('/reviews', async (req, res) => {
            const cursor = reviewCollection.find({});
            const review = await cursor.toArray();
            res.send(review);
        });
        app.get('/orders/all', async (req, res) => {
            const cursor = orderCollection.find({});
            const order = await cursor.toArray();
            res.send(order);
        });
        // get all orders by matching email
        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const cursor = orderCollection.find(query);
            const order = await cursor.toArray();
            res.send(order);
        });




        // get a single data frpm service collection
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            console.log('getting specific service', id);
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.json(service);
        });
        // get a single data frpm order collection
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            console.log('getting specific service', id);
            const query = { _id: ObjectId(id) };
            const order = await orderCollection.findOne(query);
            res.json(order);
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
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.json(result);
        });
        // Check admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
        // get all services
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find({});
            const service = await cursor.toArray();
            res.send(service);
        });


        // update status into orders collection
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const updatedStatus = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = { $set: { status: updatedStatus.status } };
            const result = await orderCollection.updateOne(filter, updateDoc, options)
            res.json(result)
        });

        // delete a data from orders collection
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.json(result);
        })

        // delete a data from service collection
        app.delete('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.json(result);
        });

        // update data into products collection
        app.put('/services/:id', async (req, res) => {
            const id = req.params.id;
            console.log('updating', id)
            const updatedService = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: updatedService.name,
                    price: updatedService.price,
                    img: updatedService.img,
                    description: updatedService.description


                },
            };
            const result = await serviceCollection.updateOne(filter, updateDoc, options)
            console.log('updating', id)
            res.json(result)


        });
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.servicePrice * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
            });
            res.json({ clientSecret: paymentIntent.client_secret })
        });

        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    payment: payment
                }
            };
            const result = await orderCollection.updateOne(filter, updateDoc);
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