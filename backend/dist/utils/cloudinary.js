"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
// Cloudinary config
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
            console.warn('[CLOUDINARY MOCK] Missing credentials. Faking upload.');
            resolve({
                secure_url: 'https://via.placeholder.com/800x600.png?text=Mock+Image',
                public_id: 'mock_image_id'
            });
            return;
        }
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder }, (error, result) => {
            if (error)
                return reject(error);
            resolve(result);
        });
        const stream = stream_1.Readable.from(buffer);
        stream.pipe(uploadStream);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
