const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const morgan = require("morgan")
const app = express()

const errorMiddleware = require("./middlewares/error")

app.use(cors())
app.use(express.json())
app.use(cookieParser())
app.use(morgan("combined"))

//Rotues
const user = require("./routes/user.routes")
const category = require("./routes/category.routes")
const project = require("./routes/project.routes")

app.use("/api/v1", user)
app.use("/api/v1", category)
app.use("/api/v1", project)

app.use("/api/v1/isWorking", (req, res) => {
    res.send("Server is working fine")
})

//Middleware for error
app.use(errorMiddleware)

module.exports = app