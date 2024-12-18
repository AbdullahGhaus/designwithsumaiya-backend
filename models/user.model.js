const mongoose = require("mongoose")
const validator = require("validator")
const bcryptjs = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Please enter user email"],
        validate: [validator.isEmail, "Please enter valid email"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Please enter user password"],
        minLength: [8, "Password should contain atleast 8 characters"],
        select: false //select false wont select password when getting user from mongoDB
    },
    resume: {
        name: { type: String },
        summary: { type: String },
        email: { type: String, validate: [validator.isEmail, "Please enter valid email"] },
        skills: { type: String },
        url: { type: String },
        experience: [
            {
                office: { type: String },
                designation: { type: String },
                date: { type: String },
                description: { type: String }
            }
        ],
        education: [
            {
                degree: { type: String },
                department: { type: String },
                institute: { type: String }
            }
        ]
    },
    resetPasswordToken: String,
    resetPasswordExpiry: String

}, { timestamps: true })

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) next()
    this.password = await bcryptjs.hash(this.password, 10)
})

// JWT Token
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })
}

//Compare Password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcryptjs.compare(enteredPassword, this.password)
}

// Generating password reset token
userSchema.methods.getResetPasswordToken = async function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpiry = Date.now() + 15 * 60 * 1000

    return resetToken;
}
module.exports = mongoose.model("User", userSchema)