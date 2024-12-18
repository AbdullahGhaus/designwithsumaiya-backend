const { v2: cloudinary } = require('cloudinary');
const ErrorHandler = require('./errorHandler');


const uploadToCloudinary = async (fileBuffer, folder, resourceType) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: resourceType },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(fileBuffer);
    });
};

const handleUploads = async (files, folder, resourceType) => {
    const uploadPromises = files.map((file) =>
        uploadToCloudinary(file.buffer, folder, resourceType)
    );
    return Promise.all(uploadPromises); // Upload all files in parallel
};

const extractPublicIdFromUrl = (url) => {
    const regex = /\/([^/]+)\.(jpg|jpeg|png|gif|webp)$/;
    const match = url.match(regex);
    if (match) {
        return match[1];
    }
    return null;
};

// Function to move files from the old folder to the new folder
const renameCloudinaryFolder = async (oldFolderPath, newFolderPath) => {
    try {
        // List all files in the old folder
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: oldFolderPath,
            max_results: 500,  // Max results per API call
        });
        console.log(result);


        // Loop through the resources and move them to the new folder
        for (const resource of result.resources) {
            // Move the file to the new folder
            await cloudinary.uploader.rename(resource.public_id, `${newFolderPath}/${resource.public_id.split('/').pop()}`);

            // Optionally, delete the old resource after moving it
            await cloudinary.uploader.destroy(resource.public_id);  // Delete the old file (optional)
        }

        // Once all files are moved, delete the old folder (if empty)
        await cloudinary.api.delete_resources_by_prefix(oldFolderPath);
    } catch (error) {
        console.error("Error while renaming Cloudinary folder:", error.message);
        throw new ErrorHandler(`Failed to rename Cloudinary folder: ${error.message}`, 500);
    }
};

// Helper function to check if file exists in Cloudinary
const fileExistsInCloudinary = async (url, folder) => {
    try {
        const publicId = url.split('/').pop().split('.')[0]; // Extracting public ID from URL
        const response = await cloudinary.api.resource(publicId);
        return response && response.folder === folder;
    } catch (error) {
        return false; // Return false if the file does not exist
    }
};

// Helper function to handle uploading files to Cloudinary
const handleUploadsUpdateProject = async (files, folder, resourceType) => {
    const uploadPromises = files.map(async (file) => {
        const fileExists = await fileExistsInCloudinary(file.path, folder);
        if (!fileExists) {
            // Upload file to Cloudinary if not already there
            const result = await cloudinary.uploader.upload_stream({
                folder,
                resource_type: resourceType,
            }, file.buffer);
            return result.secure_url;
        }
        return file.path; // Return existing file path if already in Cloudinary
    });

    return await Promise.all(uploadPromises);
};

const checkFolderExists = async (folderPath) => {
    try {
        const result = await cloudinary.api.sub_folders(folderPath);
        return {
            exists: true,
            subFolders: result.folders
        };
    } catch (error) {
        if (error?.error?.http_code === 404) {
            return { exists: false };
        } else {
            throw next(new ErrorHandler(`${error?.error?.message}`, 404));
        }
    }
};

module.exports = { handleUploads, uploadToCloudinary, extractPublicIdFromUrl, renameCloudinaryFolder, handleUploadsUpdateProject, checkFolderExists }