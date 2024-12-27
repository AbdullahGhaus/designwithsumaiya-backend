//Creating token and saving it in cookie

const sendToken = (user, statusCode, res) => {
    res
        .status(statusCode)
        .json({
            success: true,
            user,
            token: user.getJWTToken()
        })
}

module.exports = sendToken 