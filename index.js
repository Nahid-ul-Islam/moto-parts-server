const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const jwt = require('jsonwebtoken');
const verify = require('jsonwebtoken/verify');


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p9vic.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//jwt
function verifyJWT(req, res, next) {
    // console.log('abc');
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    });
}
//jwt

async function run() {
    try {
        await client.connect();
        console.log('db connected');
        const partsCollection = client.db("moto-parts").collection("parts");
        const reviewCollection = client.db("moto-parts").collection("reviews");
        const orderCollection = client.db("moto-parts").collection("orders");
        const userCollection = client.db("moto-parts").collection("user");


        //admin

        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }
        }

        //admin

        /*-------------------
        parts Api start
        -------------------*/

        //load parts
        app.get('/parts', verifyJWT, async (req, res) => {
            const query = {};
            const cursor = partsCollection.find(query);
            const parts = await cursor.toArray();
            res.send(parts);
        });

        //load a single part
        app.get('/parts/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const singlePart = await partsCollection.findOne(query);
            res.send(singlePart);
        });

        //add a new parts
        app.post('/parts', verifyJWT, async (req, res) => {
            const newParts = req.body;
            console.log('adding a new parts', newParts);
            const result = await partsCollection.insertOne(newParts);
            res.send(result);
        });

        //update availableQuantity of prarts
        app.put('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const updatedQuantity = req.body;
            // console.log(updatedQuantity);
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    availableQuantity: updatedQuantity.newQuantity
                }
            };
            const result = await partsCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        //delete one of the parts
        app.delete('/parts/:id', async (req, res) => {
            const id = req.params.id;
            console.log('deleting - id: ', id);
            const query = { _id: ObjectId(id) };
            console.log(query, 'query');
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
        app.get('/reviews', async (req, res) => {
            const reviews = await reviewCollection.find().toArray();
            res.send(reviews);
        });

        //add a new review
        app.post('/reviews', verifyJWT, async (req, res) => {
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
        app.post('/order', async (req, res) => {
            const newOrder = req.body;
            console.log('adding a new order', newOrder);
            const result = await orderCollection.insertOne(newOrder);
            res.send(result);
        });

        //get all order
        app.get('/order', verifyJWT, async (req, res) => {
            const allOrder = await orderCollection.find().toArray();
            res.send(allOrder);
        });

        //get myOrders
        app.get('/my-order', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const myOrder = await orderCollection.find(query).toArray();
            res.send(myOrder);
        });

        //delete one of myOrder
        app.delete('/my-order/:id', async (req, res) => {
            const id = req.params.id;
            console.log('deleting - id: ', id);
            const query = { _id: ObjectId(id) };
            console.log(query, 'query');
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        /*-------------------
        order Api end
        -------------------*/



        /*-------------------
        user Api start
        -------------------*/

        //get a single user for my profile
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            res.send(user);
        });

        //get all users 
        app.get('/user', verifyJWT, async (req, res) => {
            const allUser = await userCollection.find().toArray();
            res.send(allUser);
        });

        //get all 
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
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
            //jwt
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '6h' });
            //console.log("token", token);
            //jwt
            res.send({ result, token });
        });


        /*-------------------
        user Api end
        -------------------*/


    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Moto Parts is live')
});

app.listen(port, () => {
    console.log('Listening to port', port);
});