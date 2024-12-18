// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const { v2: cloudinary } = require('cloudinary');


// // Multer storage configuration
// const storage = new CloudinaryStorage({
//     cloudinary,
//     params: async (req, file) => {
//         const folderName = file.fieldname === 'images' ? 'project-images' : 'project-videos';
//         return {
//             folder: folderName,
//             resource_type: file.fieldname === 'images' ? 'image' : 'video',
//             allowed_formats: file.fieldname === 'images' ? ['jpg', 'jpeg', 'png'] : ['mp4'],
//         };
//     },
// });

// // Multer upload middleware
// const upload = multer({ storage });

// // Export middleware
// module.exports = upload;


const multer = require('multer');

// Multer storage configuration
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory

// Export middleware
module.exports = upload;
