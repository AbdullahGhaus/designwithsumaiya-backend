const ErrorHandler = require("../utils/errorHandler")

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.message = err.message || "Internal Server Error"

    //Handling wrong mongoDB _id error
    if (err.name === "CastError") {
        console.log(err);
        err = new ErrorHandler(`Resource not found. Invalid ${err.path}`, 400)
    }

    //Mongo Duplicate key error
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`
        err = new ErrorHandler(message, 400)
    }

    //Wrong JWT error
    if (err.name === "JsonWebTokenError") {
        err = new ErrorHandler(`Invalid Json Web Token, try again`, 400)
    }
     
    //Expired JWT error
    if (err.name === "TokenExpiredError") {
        err = new ErrorHandler(`Json Web Token is expired, try again`, 400)
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    })

}