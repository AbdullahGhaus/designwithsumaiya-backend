const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: 'mail.designwithsumaiya.com',
    port: 465,
    secure: true,
    auth: {
        user: 'admin@designwithsumaiya.com',
        pass: '@@Power2Sumaiya',
    },
    tls: {
        rejectUnauthorized: false, // Add this if using a self-signed certificate
    },
});

module.exports = transporter