const asyncErrors = require("../middlewares/asyncErrors");
const Category = require("../models/category.model");
const Project = require("../models/project.model");
const ErrorHandler = require("../utils/errorHandler");
const { v2: cloudinary } = require('cloudinary');
const { handleUploads, extractPublicIdFromUrl, checkFolderExists, uploadToCloudinary } = require("../utils/uploadHelpers");
const queue = require("bull")


const createProject = asyncErrors(async (req, res, next) => {
    const { name, categoryID } = req?.body;

    if (!name || !categoryID) {
        return next(new ErrorHandler('Name and CategoryID both are required', 400));
    }

    const category = await Category.findById(categoryID).populate("projects");
    if (!category) {
        return next(new ErrorHandler('Category not found', 404));
    }

    let folderPath = `projects/${name}`

    const folderExists = await checkFolderExists(folderPath)

    if (!folderExists?.exists) return next(new ErrorHandler(`${folderPath} does not exist in cloudinary`, 404))

    let assets = [];
    let nextCursor = null;

    do {
        const response = await cloudinary.api.resources_by_asset_folder(folderPath, {
            max_results: 10, // Optional: You can increase up to 500, but the default is 10
            next_cursor: nextCursor, // Pass the cursor to fetch the next set of results
        });

        assets = [...assets, ...response.resources];
        nextCursor = response.next_cursor; // Get the next cursor, if available
    } while (nextCursor); // Continue while there's a next cursor


    let urls = assets.map((x) => x.secure_url);

    if (category?.projects?.length) {
        let isProjectAlreadyExists = category?.projects?.filter(x => x?.name == name)
        if (isProjectAlreadyExists?.length) {
            return next(new ErrorHandler(`Project with name "${name}" already exists in category "${category?.name}"`, 400))
        }
    }

    const project = await Project.create({
        name,
        cloudinaryName: name,
        files: urls || [],
        categorizedMedia: [],
        categoryID,
    });

    category?.projects?.push(project?._id)

    await category.save();

    res.status(201).json({
        success: true,
        message: 'Project added successfully and linked to the category',
        project,
    });
});


const updateProjectByCloudinary = asyncErrors(async (req, res, next) => {
    const { projectID } = req?.body;

    if (!projectID) {
        return next(new ErrorHandler('ProjectID is are required', 400));
    }

    const project = await Project.findById(projectID);
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    let folderPath = `projects/${project.cloudinaryName}`

    const folderExists = await checkFolderExists(folderPath)

    if (!folderExists?.exists) return next(new ErrorHandler(`${folderPath} does not exist in cloudinary`, 404))

    let assets = await cloudinary.api.resources_by_asset_folder(folderPath)
    let urls = assets.resources?.map(x => x?.secure_url)

    project.files = urls

    await project.save();

    res.status(201).json({
        success: true,
        message: 'Project refreshed sucessfully',
        project,
    });
});

const updateProject = asyncErrors(async (req, res, next) => {
    const { id } = req?.params; // ID of the project to update
    const { name, categoryID, categorizedMedia } = req?.body;

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    // Update project name if provided
    if (name) {
        project.name = name;
    }

    if (categoryID && categoryID !== project?.categoryID?.toString()) {
        // Remove the project from the old category's projects array
        const oldCategory = await Category.findById(project?.categoryID);
        if (oldCategory) {
            oldCategory.projects = oldCategory.projects.filter(
                projectID => projectID?.toString() !== id.toString()
            );
            await oldCategory.save();
        }

        // Add the project to the new category's projects array
        const newCategory = await Category.findById(categoryID);
        if (!newCategory) {
            return next(new ErrorHandler("New category not found", 404));
        }

        newCategory.projects.push(id);
        await newCategory.save();

        // Update the project's categoryID
        project.categoryID = categoryID;
    }

    if (categorizedMedia) {
        project.categorizedMedia = categorizedMedia
    }

    // Save the updated project
    await project.save();

    res.status(200).json({
        success: true,
        project
    });
});



const deleteProject = asyncErrors(async (req, res, next) => {

    const { id } = req?.params;

    const project = await Project.findById(id);
    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    const category = await Category.findById(project.categoryID);
    if (!category) {
        return next(new ErrorHandler("Category not found", 404));
    }

    category.projects = category?.projects?.filter(projectID => projectID?.toString() !== id.toString());

    await category?.save();

    await Project.findByIdAndDelete(id);

    res.status(200).json(({
        success: true,
        message: "Project deleted"
    }))

})

const getAllProjects = asyncErrors(async (req, res, next) => {

    const projects = await Project.find().populate("categoryID", "name");

    res.status(200).json({
        success: true,
        projects,
    });
});

const getAllProjectsByCategoryID = asyncErrors(async (req, res, next) => {

    const { id } = req?.params;

    if (!id) return next(new ErrorHandler("Category ID is required", 400));

    const projects = await Project.find({ categoryID: id }).populate("categoryID", "name");

    res.status(200).json({
        success: true,
        projects,
    });
});

const projectDetails = asyncErrors(async (req, res, next) => {
    const { id } = req?.params

    if (!id) return next(new ErrorHandler("Project ID is required", 400));

    const project = await Project.findById(id).populate("categoryID", "name")

    res?.status(200)?.json({
        success: true,
        project,
    })
})

const ProjectFolderNamesByCloudinary = asyncErrors(async (req, res, next) => {

    let folderPath = `projects`

    const mainFolderExists = await checkFolderExists(folderPath)

    if (!mainFolderExists?.exists) return next(new ErrorHandler(`${folderPath} does not exist in cloudinary`, 404))

    let { folders } = await cloudinary.api.sub_folders(folderPath)

    res.status(201).json({
        success: true,
        folders: folders?.map(x => x?.name)
    });
});


const getSomeOfMyWorkProjects = asyncErrors(async (req, res, next) => {

    let folderPath = `some of my work`

    let assets = [];
    let nextCursor = null;

    do {
        const response = await cloudinary.api.resources_by_asset_folder(folderPath, {
            max_results: 10, // Optional: You can increase up to 500, but the default is 10
            next_cursor: nextCursor, // Pass the cursor to fetch the next set of results
        });

        assets = [...assets, ...response.resources];
        nextCursor = response.next_cursor; // Get the next cursor, if available
    } while (nextCursor); // Continue while there's a next cursor


    let urls = assets.map((x) => x.secure_url);

    res.status(201).json({
        success: true,
        urls
    })

});





module.exports = { createProject, updateProject, deleteProject, getAllProjectsByCategoryID, projectDetails, getAllProjects, updateProjectByCloudinary, ProjectFolderNamesByCloudinary, getSomeOfMyWorkProjects }