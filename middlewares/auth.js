const ErrorHandler = require("../utils/errorHandler");
const asyncErrors = require("./asyncErrors");
const jwt = require("jsonwebtoken")
const User = require("../models/user.model")

const isAuthenticated = asyncErrors(async (req, res, next) => {

    const { authorization: token } = req?.headers;
    if (!token) return next(new ErrorHandler("Please login to access this resource", 401));

    const { id } = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(id)
    next()
})

const authorizedRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) return next(new ErrorHandler(`Role: ${req.user.role} is not allowed to access this resource`, 403));
        next()
    }
}

module.exports = { isAuthenticated, authorizedRoles }