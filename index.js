const express = require ("express");
const path = require ('path');
const { connectToMongoDB } = require ("./connection");
const cookieParser = require('cookie-parser');
const { restrictToLoggedinUserOnly, checkAuth } = require('./middlewares/auth')
const URL = require ("./models/url");

const urlRoute = require ("./routes/url");
const staticRoute = require('./routes/staticRouter');
const userRoute = require('./routes/user');

const app = express();
const PORT = 8001;

connectToMongoDB("mongodb://localhost:27017/url-shortner")
.then(() => console.log("connected to MongoDB"));

app.set("view engine", "ejs");
app.set('views', path.resolve("./views"))

app.use(express.json());
app.use(express.urlencoded({ extended : false}));
app.use(cookieParser());

app.use("/url", restrictToLoggedinUserOnly, urlRoute);
app.use("/user", userRoute);
app.use("/", checkAuth, staticRoute);

app.get("/url/:shortId", async (req, res) => {
    const shortId = req.params.shortId;

    // Ignore favicon.ico requests
    // if (shortId === "favicon.ico") {
    //     return res.status(204).end();
    // }

    const entry = await URL.findOneAndUpdate(
        { shortId }, 
        { $push: {
            visitHistory : { 
                timestamp: Date.now(), 
            },
        }, 
    },
    { new: true });
    res.redirect(entry.redirectURL);
});

app.listen(PORT, () => console.log(`Server running on PORT : ${PORT}`));