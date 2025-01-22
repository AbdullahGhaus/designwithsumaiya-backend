const asyncErrors = require("../middlewares/asyncErrors.js")
const ErrorHandler = require("../utils/errorHandler.js")
const User = require("../models/user.model.js")
const sendToken = require("../utils/jwtToken.js")
const crypto = require("crypto")
const { v2: cloudinary } = require('cloudinary');
const { uploadToCloudinary } = require("../utils/uploadHelpers.js")
const { default: axios } = require("axios")
// const nodemailer = require("nodemailer")
const transporter = require("../config/nodemailer.js")


//Register User
exports.registerUser = asyncErrors(async (req, res, next) => {
    const { email, password } = req.body

    const user = await User.create({
        email,
        password,
        resume: {
            name: "",
            summary: "",
            email: email,
            skills: "",
            url: "",
            experience: [
                {
                    office: "",
                    designation: "",
                    date: "",
                    description: ""
                }
            ],
            education: [
                {
                    degree: "",
                    department: "",
                    institute: ""
                }
            ]
        },
    })

    sendToken(user, 201, res)
})


//Login User 
exports.loginUser = asyncErrors(async (req, res, next) => {

    const { email, password } = req.body

    if (!email || !password) return next(new ErrorHandler("Please enter email and password", 400));

    const user = await User.findOne({ email }).select("+password")

    if (!user) return next(new ErrorHandler("User does not exist", 404));

    const isPasswordMatched = await user.comparePassword(password)

    if (!isPasswordMatched) return next(new ErrorHandler("Invalid email or password", 401));

    sendToken(user, 200, res)


})

//Logout User 
exports.logoutUser = asyncErrors(async (req, res, next) => {

    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })
    res.status(200).json({
        success: true,
        message: "Logged out"
    })

})


//Forgot Password
exports.forgotPassword = asyncErrors(async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email })
    if (!user) return next(new ErrorHandler("User not found", 404));

    const resetToken = await user.getResetPasswordToken()

    await user.save({ validateBeforeSave: false })

    res.status(200).json(({
        success: true,
        resetToken: resetToken
    }))

})


//Reset Password
exports.resetPassword = asyncErrors(async (req, res, next) => {

    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken, resetPasswordExpiry: { $gt: Date.now() } })

    if (!user) return next(new ErrorHandler("Reset password token is invalid or expired", 400));
    if (req.body.password !== req.body.confirmPassword) return next(new ErrorHandler("Passwords doesnt match", 400));

    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpiry = undefined

    await user.save()

    sendToken(user, 200, res)

})


//Looged in User Details
exports.userDetails = asyncErrors(async (req, res, next) => {

    const user = await User.findById(req.user.id)
    if (!user) return next(new ErrorHandler("User not found", 404));

    res.status(200).json({
        success: true,
        user
    })

})

//Update Password
exports.updatePassword = asyncErrors(async (req, res, next) => {

    const user = await User.findById(req.user.id).select("+password")
    if (!user) return next(new ErrorHandler("User not found", 404));

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) return next(new ErrorHandler("Old Password is not correct", 400));

    if (req.body.newPassword !== req.body.confirmPassword) return next(new ErrorHandler("Passwords doesnt match", 400));

    user.password = req.body.newPassword

    await user.save()

    sendToken(user, 200, res)

})

exports.updateResume = asyncErrors(async (req, res, next) => {

    const { id } = req.params
    const { name, summary, email, skills, experience, education } = req.body

    const user = await User.findById(id);

    if (!user) return next(new ErrorHandler("User not found", 404));

    if (name) user.resume.name = name
    if (summary) user.resume.summary = summary
    if (email) user.resume.email = email
    if (skills) user.resume.skills = skills
    if (experience && experience?.length) user.resume.experience = experience
    if (education && education?.length) user.resume.education = education

    let folderAssets = await cloudinary.api.resources_by_asset_folder(`resume`)
    let publicIds = folderAssets?.resources?.map(x => x?.secure_url)
    if (publicIds?.length) user.resume.url = publicIds[0]

    await user.save()

    res.status(200).json({
        success: true,
        user
    })

})


//Update User Profile
exports.updateUserImageByCloudinary = asyncErrors(async (req, res, next) => {

    const { id } = req.params
    const user = await User.findById(id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    console.log(user);


    let folderAssets = await cloudinary.api.resources_by_asset_folder(`resume`)
    let publicIds = folderAssets?.resources?.map(x => x?.secure_url)
    if (!publicIds?.length) return nwxt(new ErrorHandler("No file found in cloudinary", 404))
    user.resume.url = publicIds[0]

    await user.save({ validateBeforeSave: false })

    res.status(200).json({
        success: true,
        user
    })

})

exports.getUserResumeDetails = asyncErrors(async (req, res, next) => {

    const users = await User.find();
    const user = users[0]
    if (!user) return next(new ErrorHandler("User not found", 404));

    res.status(200).json({
        success: true,
        user
    })

})


exports.cloudinaryUsageDetails = asyncErrors(async (req, res, next) => {

    let usage = await cloudinary.api.usage()

    res.status(200).json({
        success: true,
        usage: usage
    })

})


exports.sendEmail = asyncErrors(async (req, res, next) => {

    let { name, email, phone, subject, message } = req.body

    if (!name || !email || !phone || !subject || !message) return next(new ErrorHandler("Kindly fill all fields", 400))

    await transporter().sendMail({
        from: "Design With Sumaiya Website <admin@designwithsumaiya.com>",
        to: "sumaiyaghani123@gmail.com", // Replace this with the dynamic email address as necessary
        subject: "New Quote Request from Design With Sumaiya Website",
        text: `
                You have received a new quote request from your Design With Sumaiya Website:
        
                Name: ${name}
                Email: ${email}
                Phone: ${phone}
                Subject: ${subject}
                Message: ${message}
            `,
        // Optionally, you can add HTML formatting for a more professional look
        html: `
                <p>You have received a new quote request from your Design With Sumaiya Website:</p>
                <ul>
                    <li><strong>Name:</strong> ${name}</li>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Phone:</strong> ${phone}</li>
                    <li><strong>Subject:</strong> ${subject}</li>
                    <li><strong>Message:</strong> ${message}</li>
                </ul>
            `,
    });

    return res.status(200).json({ success: true, message: 'Email sent successfully' });

})




