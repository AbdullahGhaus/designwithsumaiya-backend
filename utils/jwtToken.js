//Creating token and saving it in cookie

const sendToken = (user, statusCode, res) => {
    res
        .status(statusCode)
        // .cookie("token", user.getJWTToken(), {
        //     expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        //     httpOnly: true
        // })
        .json({
            success: true,
            user,
            token: user.getJWTToken()
        })
}

module.exports = sendToken 