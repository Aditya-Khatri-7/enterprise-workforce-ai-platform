const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadResume = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const isPdf = originalName.toLowerCase().endsWith('.pdf');
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'workforce/resumes',
        resource_type: 'raw',
        format: isPdf ? 'pdf' : undefined,
        public_id: `resume_${Date.now()}`
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

const getResumeDownloadUrl = (publicId) => {
  if (!publicId) return null;
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    secure: true,
    flags: 'attachment'
  });
};

module.exports = { cloudinary, uploadResume, getResumeDownloadUrl };
