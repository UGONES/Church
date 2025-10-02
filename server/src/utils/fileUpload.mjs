import multer from "multer";
import path from "path";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.mjs";

// Configure storage for different file types
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "church-app/images",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
  },
});

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "church-app/videos",
    resource_type: "video",
    allowed_formats: ["mp4", "mov", "avi", "wmv", "flv"],
    chunk_size: 6000000, // 6MB chunks
  },
});

const audioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "church-app/audio",
    resource_type: "video", // Cloudinary treats audio as video
    allowed_formats: ["mp3", "wav", "m4a", "ogg"],
    chunk_size: 6000000, // 6MB chunks
  },
});

// File filters
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed"), false);
  }
};

const audioFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files are allowed"), false);
  }
};

// Configure multer instances
const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter,
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: videoFilter,
});

const uploadAudio = multer({
  storage: audioStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: audioFilter,
});

// Middleware for different upload types
const handleImageUpload = uploadImage.single("image");
const handleVideoUpload = uploadVideo.single("video");
const handleAudioUpload = uploadAudio.single("audio");

// Handle multiple file types
const handleMediaUpload = (req, res, next) => {
  const upload = multer({
    storage: new CloudinaryStorage({
      cloudinary,
      params: (req, file) => {
        let folder = "church-app/files";
        let resource_type = "auto";

        if (file.mimetype.startsWith("image/")) {
          folder = "church-app/images";
        } else if (file.mimetype.startsWith("video/")) {
          folder = "church-app/videos";
          resource_type = "video";
        } else if (file.mimetype.startsWith("audio/")) {
          folder = "church-app/audio";
          resource_type = "video"; // Cloudinary treats audio as video
        }

        return {
          folder,
          resource_type,
          allowed_formats: [
            "jpg",
            "jpeg",
            "png",
            "gif",
            "mp4",
            "mov",
            "avi",
            "mp3",
            "wav",
          ],
          transformation: file.mimetype.startsWith("image/")
            ? [{ width: 1000, height: 1000, crop: "limit" }]
            : [],
        };
      },
    }),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
      if (
        file.mimetype.startsWith("image/") ||
        file.mimetype.startsWith("video/") ||
        file.mimetype.startsWith("audio/")
      ) {
        cb(null, true);
      } else {
        cb(new Error("Only image, video, and audio files are allowed"), false);
      }
    },
  }).single("file");

  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

export default {
  uploadImage,
  uploadVideo,
  uploadAudio,
  handleImageUpload,
  handleVideoUpload,
  handleAudioUpload,
  handleMediaUpload,
};
