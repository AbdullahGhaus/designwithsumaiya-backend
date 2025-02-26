const express = require("express")
const { isAuthenticated } = require("../middlewares/auth")
const { createProject, updateProject, deleteProject, getAllProjectsByCategoryID, projectDetails, getAllProjects, updateProjectByCloudinary, ProjectFolderNamesByCloudinary, getSomeOfMyWorkProjects } = require("../controllers/project.controller")
const ErrorHandler = require("../utils/errorHandler")
const upload = require("../middlewares/multer")
const router = express.Router()

router.route('/projects').get(getAllProjects)
router.route('/project').post(isAuthenticated, createProject)
router.route('/project/names').get(isAuthenticated, ProjectFolderNamesByCloudinary)
router.route('/project/:id').get(projectDetails)
router.route('/some-of-my-work').get(getSomeOfMyWorkProjects)
router.route('/project/category/:id').get(getAllProjectsByCategoryID)
router.route('/project/:id').put(isAuthenticated, updateProject)
router.route('/project/:id').delete(isAuthenticated, deleteProject)
router.route('/project/cloudinary/:id').put(isAuthenticated, updateProjectByCloudinary)

module.exports = router