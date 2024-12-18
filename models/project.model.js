const mongoose = require("mongoose")

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter category name"],
    },
    files: [
        { type: String }
    ],
    categorizedMedia: {
        videos: [{ type: String }],
        images: [{ type: String }],
        stories: [
            { files: [{ type: String }] }
        ]
    },
    categoryID: {
        type: mongoose.Schema.ObjectId,
        ref: "Category"
    },
    cloudinaryName: { type: String }

}, { timestamps: true })

const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);

module.exports = Project;