const asyncErrors = require("../middlewares/asyncErrors");
const Category = require("../models/category.model");
const Project = require("../models/project.model");
const ErrorHandler = require("../utils/errorHandler");
const { v2: cloudinary } = require("cloudinary")
const { uploadToCloudinary, extractPublicIdFromUrl, checkFolderExists } = require("../utils/uploadHelpers");

const createCategory = asyncErrors(async (req, res, next) => {
    let { name } = req.body

    const folderPath = `categories/${name}`

    const folderExists = await checkFolderExists(folderPath)

    if (!folderExists?.exists) return next(new ErrorHandler(`No folder found with name ${name} on cloudinary`, 404))

    let assets = await cloudinary.api.resources_by_asset_folder(folderPath)
    let urls = assets.resources?.map(x => x?.secure_url)

    const allCategories = await Category.find()

    const category = await Category.create({
        name,
        projects: [],
        cloudinaryName: name,
        sortOrder: allCategories?.length + 1,
        thumbnail: urls[0]
    })

    await category.save()

    res.status(200).json(({
        success: true,
        category
    }))

})

const updateCategoryByCloudinary = asyncErrors(async (req, res, next) => {
    const { categoryID } = req?.body;

    if (!categoryID) {
        return next(new ErrorHandler('CategoryID is are required', 400));
    }

    const category = await Category.findById(categoryID);
    if (!category) {
        return next(new ErrorHandler('Category not found', 404));
    }

    let folderPath = `categories/${category.cloudinaryName}`

    const folderExists = await checkFolderExists(folderPath)

    if (!folderExists?.exists) return next(new ErrorHandler(`${folderPath} does not exist in cloudinary`, 404))

    let assets = await cloudinary.api.resources_by_asset_folder(folderPath)
    let urls = assets.resources?.map(x => x?.secure_url)

    category.thumbnail = urls[0]

    await category.save();

    res.status(201).json({
        success: true,
        message: 'Category refreshed sucessfully',
        category,
    });
});



const updateCategory = asyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { name, direction } = req.body;

    const category = await Category.findById(id);
    if (!category) {
        return next(new ErrorHandler("Category not found", 404));
    }

    // If moving the category up or down
    if (direction) {
        if (direction !== 'up' && direction !== 'down') {
            return res.status(400).json({ message: 'Invalid direction. Use "up" or "down".' });
        }

        const oldSortOrder = category.sortOrder;

        let newSortOrder;
        if (direction === 'up') newSortOrder = oldSortOrder - 1;
        else if (direction === 'down') newSortOrder = oldSortOrder + 1;

        const count = await Category.countDocuments();
        if (newSortOrder < 1 || newSortOrder > count) {
            return res.status(400).json({ message: 'Invalid sortOrder after move' });
        }

        // Get the affected category(s) and others in the same range
        let affectedCategories;
        if (direction === 'up') {
            // Get the category that will take the category's old position
            affectedCategories = await Category.find({ sortOrder: { $gte: newSortOrder, $lt: oldSortOrder } });
        } else if (direction === 'down') {
            // Get the category that will take the category's old position
            affectedCategories = await Category.find({ sortOrder: { $gt: oldSortOrder, $lte: newSortOrder } });
        }

        // Update the sortOrder of affected categories
        for (let i = 0; i < affectedCategories.length; i++) {
            const cat = affectedCategories[i];
            if (direction === 'up') {
                cat.sortOrder += 1;  // Move categories down
            } else if (direction === 'down') {
                cat.sortOrder -= 1;  // Move categories up
            }
            await cat.save();
        }

        // Update the current category's sortOrder
        category.sortOrder = newSortOrder;
        await category.save();
    }

    // Update the name if provided
    if (name) category.name = name;

    // Save the updated category
    await category.save();

    res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category,
    });
});



const deleteCategory = asyncErrors(async (req, res, next) => {

    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
        return next(new ErrorHandler("Category not found", 404));
    }

    if (category?.projects?.length) return next(new ErrorHandler("Disassociate projects to delete.", 404));

    await Project.updateMany({ categoryID: id }, { $set: { categoryID: null } })

    await Category.findByIdAndDelete(id);

    res.status(200).json(({
        success: true,
        message: "Category deleted, and categoryID removed from associated projects"
    }))

})


const getAllCategories = asyncErrors(async (req, res, next) => {

    const categories = await Category.find().populate("projects");
    const totalCategories = await Category.countDocuments()

    res.status(200).json(({
        success: true,
        count: totalCategories,
        categories,
    }))

})

const categoryDetails = asyncErrors(async (req, res, next) => {

    const { id } = req?.params;

    const category = await Category.findById(id).populate('projects');

    if (!category) {
        return next(new ErrorHandler("Category not found", 404));
    }

    res.status(200).json({
        success: true,
        category
    });

})

const CategoryFolderNamesByCloudinary = asyncErrors(async (req, res, next) => {

    let folderPath = `categories`

    const mainFolderExists = await checkFolderExists(folderPath)

    if (!mainFolderExists?.exists) return next(new ErrorHandler(`${folderPath} does not exist in cloudinary`, 404))

    let { folders } = await cloudinary.api.sub_folders(folderPath)

    res.status(201).json({
        success: true,
        folders: folders?.map(x => x?.name)
    });
});





module.exports = { createCategory, updateCategory, deleteCategory, getAllCategories, categoryDetails, updateCategoryByCloudinary, CategoryFolderNamesByCloudinary }