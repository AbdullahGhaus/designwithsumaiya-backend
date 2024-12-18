const express = require("express")
const { isAuthenticated } = require("../middlewares/auth")
const { createCategory, updateCategory, deleteCategory, getAllCategories, categoryDetails, updateCategoryByCloudinary, CategoryFolderNamesByCloudinary } = require("../controllers/category.controller")
const upload = require("../middlewares/multer")
const router = express.Router()

router.route('/category').post(isAuthenticated, createCategory)
router.route('/categories').get(getAllCategories)
router.route('/category/names').get(isAuthenticated, CategoryFolderNamesByCloudinary)
router.route('/category/:id').get(categoryDetails)
router.route('/category/:id').put(isAuthenticated, updateCategory)
router.route('/category/:id').delete(isAuthenticated, deleteCategory)
router.route('/category/cloudinary/:id').put(isAuthenticated, updateCategoryByCloudinary)



module.exports = router