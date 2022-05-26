const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p9vic.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try{
        await client.connect();
        console.log('db connected');
        const partsCollection = client.db("moto-parts").collection("parts");
        const reviewCollection = client.db("moto-parts").collection("reviews"); 
        const orderCollection = client.db("moto-parts").collection("orders"); 
        const userCollection = client.db("moto-parts").collection("user"); 
        
        
        /*-------------------
        parts Api start
        -------------------*/
        
        //load parts
        app.get('/parts', async(req, res) => {
            const query = {};
            const cursor = partsCollection.find(query);
            const parts = await cursor.toArray();
            res.send(parts);
        });

        //load a single part
        app.get('/parts/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const singlePart = await partsCollection.findOne(query);
            res.send(singlePart);
        });

        //update availableQuantity of prarts
        app.put('/parts/:id', async(req, res) =>{
            const id = req.params.id;
            const updatedQuantity = req.body;
            // console.log(updatedQuantity);
            const filter = {_id: ObjectId(id)};
            const options = {upsert: true};
            const updateDoc = {
                $set: {
                    availableQuantity: updatedQuantity.newQuantity
                }
            };
            const result = await partsCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        //delete one of the parts
        app.delete('/parts/:id', async(req, res) => {
            const id = req.params.id;
            console.log('deleting - id: ', id);
            const query = { _id: ObjectId(id) };
            console.log(query,'query');
            const result = await partsCollection.deleteOne(query);
            res.send(result);
        });

        /*-------------------
        parts Api end
        -------------------*/
        


        
        /*-------------------
        review Api start
        -------------------*/
        
        //load reviews
        app.get('/reviews', async(req, res) => {
            const reviews = await reviewCollection.find().toArray();
            res.send(reviews); 
        });

        //add a new review
        app.post('/reviews', async(req, res) => {
            const newReview = req.body;
            console.log('adding a new review', newReview);
            const result = await reviewCollection.insertOne(newReview);
            res.send(result);
        });

        /*-------------------
        review Api end
        -------------------*/
        

        
        /*-------------------
        order Api start
        -------------------*/
        
        //post newOrder
        app.post('/order', async(req, res) => {
            const newOrder = req.body;
            console.log('adding a new order', newOrder);
            const result = await orderCollection.insertOne(newOrder);
            res.send(result);
        });

        //get all order
        app.get('/order', async(req, res) => {
            const allOrder = await orderCollection.find().toArray();
            res.send(allOrder);
        });

        //get myOrders
        app.get('/my-order', async(req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const myOrder = await orderCollection.find(query).toArray();
            res.send(myOrder);
        });

        //delete one of myOrder
        app.delete('/my-order/:id', async(req, res) => {
            const id = req.params.id;
            console.log('deleting - id: ', id);
            const query = { _id: ObjectId(id) };
            console.log(query,'query');
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        /*-------------------
        order Api end
        -------------------*/



        /*-------------------
        user Api start
        -------------------*/

        //get user
        app.get('/user/:email', async(req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            res.send(user);
        });

        //put user
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });


        /*-------------------
        user Api end
        -------------------*/
        

    }
    finally{

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Moto Parts is live')
});

app.listen(port, () => {
    console.log('Listening to port', port);
});