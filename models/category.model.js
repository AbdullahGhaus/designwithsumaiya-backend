const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter category name"],
    },
    projects: [
        { type: mongoose.Schema.ObjectId, ref: "Project" }
    ],
    sortOrder: {
        type: Number,
        required: true
    },
    thumbnail: { type: String },
    cloudinaryName: { type: String }

}, { timestamps: true })

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

module.exports = Category;