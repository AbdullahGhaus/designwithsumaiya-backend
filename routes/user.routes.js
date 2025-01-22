const express = require("express")
const { registerUser, loginUser, logoutUser, forgotPassword, resetPassword, getResume, updateResume, updateUserImageByCloudinary, getUserResumeDetails, cloudinaryUsageDetails, sendEmail } = require("../controllers/user.controller")
const { isAuthenticated, authorizedRoles } = require("../middlewares/auth")
const upload = require("../middlewares/multer")
const router = express.Router()

router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/forgot-password').post(forgotPassword)
router.route('/resume').get(getUserResumeDetails)
router.route("/logout").get(logoutUser)
router.route('/reset-password/:token').put(resetPassword)
router.route('/mail').post(sendEmail)
router.route('/cloudinary/usage').get(isAuthenticated, cloudinaryUsageDetails)
router.route('/resume/:id').put(isAuthenticated, updateResume)
router.route('/resume/cloudinary/:id').put(isAuthenticated, updateUserImageByCloudinary)


module.exports = router