const nodemailer = require("nodemailer")

const sendEmail = async ({ email, subject, message }) => {

    const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD
        }
    })

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        text: message
    }

    await transporter.sendMail(mailOptions)

}

module.exports = sendEmail