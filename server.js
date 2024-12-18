const app = require("./app");
const dotenv = require("dotenv");
const connectMongoDB = require("./config/mongo");
const { v2: cloudinary } = require('cloudinary');


//Handling Uncaught Exceptions
process.on("uncaughtException", err => {
    console.log("Error: ", err.message);
    console.log("Shutting down server due to uncaught exception");
    process.exit(1)
})

//Config
dotenv.config({ path: "./config/config.env" })

//Connect database
connectMongoDB()

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const server = app.listen(process.env.PORT, () => {
    console.log('\x1b[33m%s\x1b[0m', `Server is working on:`, `http://localhost:${process.env.PORT}`)
})

server.timeout = 10 * 60 * 1000

//Handling Unhandled Promise Rejection
process.on("unhandledRejection", err => {
    console.log("Error: ", err);
    console.log("Shutting down server due to unhandled promise rejection");

    server.close(() => {
        process.exit(1)
    })
})