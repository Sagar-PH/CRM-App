const express = require('express')
const session = require('express-session')

const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors')
const express_app = express()

let user_collection = undefined;
let user_database = undefined;

express_app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Store Sessions
express_app.use(cors({
    origin: "http://localhost:4200",
    credentials: true
}));

express_app.use(express.json());
express_app.use(express.urlencoded({ extended: true }));


express_app.use(async (req, res, next) => {
    // console.log('Session ID:', req.session.user);
    if (req.session.user) {
        const user_found = await findInCollection(user_collection, {
            UserName: req.session.user['username']
        })

        if (user_found !== null) {
            // console.log('user found:: ', user_found)
            user_database = client.db(user_found['Database'])
        }
    }
    
    next();
});

const PORT = 8080

const url = "mongodb+srv://sagarph_db_user:Sagar%401701@cluster0.7epy1hb.mongodb.net/?appName=Cluster0";
const client = new MongoClient(url, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const collections = ['Contacts', 'Tasks', 'PurchaseOrders', 'SalesOrders', 'Vendors']

express_app.post('/login', async (req, res) => {
    // console.log('login requested..', req.body)

    if (isAuthenticated(req)) {
        return res.send({ type: 'login', status: "Redirect" })
    }

    const user_found = await user_collection.findOne({
        UserName: req.body['username'],
        Password: req.body['password']
    })

    if (user_found) {
        req.session.user = { username: req.body['username'] }
        return res.send({ type: 'login', status: "Success" })
    }

    return res.send({ type: 'login', status: "User not Exist" })

})

express_app.post('/logout', async (req, res) => {
    // console.log('logout requested..', req.body)

    if (isAuthenticated(req)) {
        req.session.user = null
    }

    return res.send({ type: 'logout', status: "Redirect" })
})

express_app.post("/logout", (req, res) => {
    if (!isAuthenticated(req)) {
        res.json({ type: 'logout', status: "no User" });
    }

    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ status: "Failed" });
        }

        res.clearCookie("connect.sid");
        res.json({ type: 'logout', status: "Success" });
    });
});

express_app.get('/auth/check', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ authenticated: true });
    }
    res.json({ authenticated: false });
});

express_app.post('/register', async (req, res) => {
    console.log('register requested..', req.body)

    if (isAuthenticated(req)) {
        return res.send({ type: 'register', status: "Redirect" })
    }

    const user_db = req.body['username'] + '_db'

    var user_data = {
        Name: req.body['fullname'],
        UserName: req.body['username'],
        Email: req.body['email'],
        Password: req.body['password'],
        Database: user_db
    }

    let insert_status = await insertToCollection(user_collection, user_data)

    if (insert_status) {
        user_database = client.db(user_db);

        collections.forEach((collection) => {
            user_database.createCollection(collection)
        })

        return res.send({ type: 'register', status: "Success" })
    }

    return res.send({ type: 'register', status: "Failed" })

})

express_app.post('/purchase_order/create', async (req, res) => {
    const p_order_col = user_database.collection('PurchaseOrders')

    var purchase_order = {
        OrderId: req.body['orderid'],
        SupplierId: req.body['supplierid'],
        SupplierName: req.body['suppliername'],
        Date: req.body['date'],
        Currency: req.body['currency']
    }

    let insert_status = await insertToCollection(p_order_col, purchase_order)

    if (insert_status) {
        return res.send({ 'status': 'inserted' })
    }

    return res.send({ 'status': 'insert failed' })
})

express_app.get('/purchase_order/view', async (req, res)=>{
    const all_p_orders = await user_database.collection('PurchaseOrders').find().toArray()
    return res.send({'orders_request': all_p_orders})
})

express_app.post('/sales_order/create', async (req, res) => {
    const s_order_col = user_database.collection('SalesOrders')

    var sales_order = {
        OrderId: req.body['orderid'],
        VendorId: req.body['vendorid'],
        VendorName: req.body['vendorname'],
        Date: req.body['date'],
        Currency: req.body['currency']
    }

    let insert_status = await insertToCollection(s_order_col, sales_order)

    if (insert_status) {
        return res.send({ 'status': 'inserted' })
    }

    return res.send({ 'status': 'insert failed' })
})

express_app.get('/sales_order/view', async (req, res)=>{
    const all_s_orders = await user_database.collection('SalesOrders').find().toArray()
    return res.send({'orders_request': all_s_orders})
})

async function connectDB() {
    try {
        await client.connect();
        const db = client.db("CRMAccount");

        // const user_check = await db.listCollections({"name": "users"}).toArray()
        // console.log(List of collection from query:: , user_check.length)

        // await db.createCollection("users");

        // Create if not present, use if present
        user_collection = db.collection('users')
        await user_collection.createIndex({ username: 1 }, { unique: true });

        console.log("Connected to MongoDB", db.users);
    } catch (err) {
        console.error(err);
    }
}

async function insertToCollection(db_collection, user_data) {
    try {
        await db_collection.insertOne(user_data)
        return true
    } catch (err) {
        return false
    }
}

async function findInCollection(db_collection, find_query) {
    try {
        const result = await db_collection.findOne(find_query)
        // console.log("Found the data:: ", result)
        return result
    } catch (err) {
        console.log('Querying Failed!', err)
        return null
    }
}

async function updateCollection(udt_collection, update_data, upsert = false) {
    try {
        const result = await user_collection.updateOne(
            udt_collection,
            {
                $set: update_data
            },
            { upsert: upsert }
        )

        console.log("Update Success:: ", result)
    } catch (err) {
        console.log('Querying Failed!', err)
    }
}

function isAuthenticated(request) {
    let user_check = request.session.user
    if (user_check === undefined || user_check === null) {
        return false
    }

    return true
}

express_app.listen(PORT, async () => {
    await connectDB()
    console.log('Listening...', PORT)
})