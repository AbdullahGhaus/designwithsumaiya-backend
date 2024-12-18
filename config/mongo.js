const mongoose = require('mongoose')

const connectMongoDB = async () => {
    mongoose
        .connect(`${process.env.MONGODB_URI}`)
        .then(instance => console.log('\x1b[33m%s\x1b[0m', "MongoDB connected, DB HOST:", instance.connection.host))
}

module.exports = connectMongoDB