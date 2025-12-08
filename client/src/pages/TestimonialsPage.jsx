import { useState, useEffect, useRef } from "react";
import { testimonialService } from '../services/apiService';
import Loader, { PageLoader, ContentLoader } from '../components/Loader';
import { useAlert } from '../utils/Alert';
import { Testimonial } from '../models/Testimonial';
import useAuth from '../hooks/useAuth';

const TestimonialsPage = () => {
  const { user } = useAuth();
  const alert = useAlert();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [videoTestimonials, setVideoTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  const [testimonialStats, setTestimonialStats] = useState(null);

  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  useEffect(() => {
    document.title =
      "SMC: - Testimonies | St. Micheal`s & All Angels Church | Ifite-Awka";

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch public data in parallel
        const [testimonialsResponse, videosResponse, categoriesResponse] =
          await Promise.allSettled([
            testimonialService.getAll(),
            testimonialService.getVideos(),
            testimonialService.getCategories(),
          ]);

        if (testimonialsResponse.status === 'fulfilled') {
          const response = testimonialsResponse.value;
          console.log('📊 Testimonials API Response:', response);

          let testimonialsData = [];

          // Your API returns { testimonials: [], totalPages: x, currentPage: x, total: x }
          if (response?.data?.testimonials) {
            testimonialsData = response.data.testimonials;
          } else if (response?.testimonials) {
            testimonialsData = response.testimonials;
          } else if (Array.isArray(response?.data)) {
            testimonialsData = response.data;
          } else if (Array.isArray(response)) {
            testimonialsData = response;
          }

          console.log('📊 Extracted testimonials:', testimonialsData);

          setTestimonials(
            Array.isArray(testimonialsData)
              ? testimonialsData.map((t) => new Testimonial(t))
              : []
          );
        } else {
          console.error(
            "Failed to fetch testimonials:",
            testimonialsResponse.reason,
          );
          setTestimonials([]);
        }

        if (videosResponse.status === 'fulfilled') {
          const response = videosResponse.value;
          console.log('🎥 Videos API Response:', response);

          let videosData = [];

          // Handle different response structures
          if (Array.isArray(response?.data)) {
            videosData = response.data;
          } else if (Array.isArray(response)) {
            videosData = response;
          } else if (response?.data && Array.isArray(response.data.videos)) {
            videosData = response.data.videos;
          }

          console.log('🎥 Extracted videos:', videosData);

          // ✅ FIXED: Process videos with proper error handling
          const processedVideos = Array.isArray(videosData) ? videosData
            .filter(video => video && (video.videoUrl || video.videoFile)) // Only include videos with actual video files
            .map(video => ({
              id: video._id || video.id,
              _id: video._id || video.id,
              title: video.title || `Testimony from ${video.name || 'Member'}`,
              description: video.description || video.content,
              videoUrl: video.videoUrl || video.videoFile,
              thumbnail: video.thumbnail || video.imageUrl,
              duration: video.duration,
              author: video.author || video.name,
              ...video
            })) : [];

          console.log('🎥 Processed videos with video files:', processedVideos);
          setVideoTestimonials(processedVideos);
        } else {
          console.error(
            "Failed to fetch video testimonials:",
            videosResponse.reason,
          );
          setVideoTestimonials([]);
        }

        if (categoriesResponse.status === 'fulfilled') {
          const response = categoriesResponse.value;
          console.log('📂 Categories API Response:', response);

          let categoriesData = [];

          if (Array.isArray(response?.data)) {
            categoriesData = response.data;
          } else if (Array.isArray(response)) {
            categoriesData = response;
          }

          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } else {
          console.error(
            "Failed to fetch categories:",
            categoriesResponse.reason,
          );
          setCategories([]);
        }

        if (isAdmin) {
          try {
            const [allResponse, statsResponse] = await Promise.allSettled([
              testimonialService.getAllAdmin(),
              testimonialService.getStats(),
            ]);

            // Handle stats response
            if (statsResponse.status === 'fulfilled') {
              const response = statsResponse.value;
              console.log('📈 Stats API Response:', response);
              setTestimonialStats(response.data || response);
            } else {
              console.error('Failed to fetch stats:', statsResponse.reason);
            }

            // Handle admin testimonials response
            if (allResponse.status === 'fulfilled') {
              const response = allResponse.value;
              console.log('👑 Admin testimonials API Response:', response);

              let adminTestimonialsData = [];

              // Your admin endpoint returns same structure: { testimonials: [], ... }
              if (response?.data?.testimonials) {
                adminTestimonialsData = response.data.testimonials;
              } else if (response?.testimonials) {
                adminTestimonialsData = response.testimonials;
              } else if (Array.isArray(response?.data)) {
                adminTestimonialsData = response.data;
              }

              console.log('👑 Extracted admin testimonials:', adminTestimonialsData);

              // Only update if we got valid admin data
              if (Array.isArray(adminTestimonialsData) && adminTestimonialsData.length > 0) {
                setTestimonials(adminTestimonialsData.map((t) => new Testimonial(t)));
              }
            } else {
              console.error('Failed to fetch admin testimonials:', allResponse.reason);
            }
          } catch (adminError) {
            console.error("Error fetching admin data:", adminError);
          }
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        const errorMsg =
          error.response?.data?.message ||
          "Failed to load testimonials. Please try again later.";
        setError(errorMsg);
        alert.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, alert]);

  // ✅ FIXED: Refetch function with consistent response handling
  const refetchTestimonials = async () => {
    try {
      const response = await testimonialService.getAll();
      const testimonialsData = response?.data?.testimonials || response?.data || response || [];
      setTestimonials(
        Array.isArray(testimonialsData) ? testimonialsData.map((t) => new Testimonial(t)) : []
      );
    } catch (error) {
      console.error("Error refetching testimonials:", error);
    }
  };

  // ✅ FIXED: Submit testimonial with proper response handling
  const handleSubmitTestimonial = async (formData) => {
    try {
      setError(null);
      const response = await testimonialService.submit(formData);

      // Handle success response consistently
      if (response.status === 201 || response.data) {
        setSubmissionSuccess(true);
        setShowSubmitForm(false);
        await refetchTestimonials();
        alert.success(
          response.data?.message || "Testimonial submitted successfully!",
        );
      }
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Failed to submit testimonial. Please try again.";
      setError(errorMsg);
      alert.error(errorMsg);
    }
  };

  // ✅ FIXED: Admin update testimonial with consistent response handling
  const handleUpdateTestimonial = async (testimonialId, updates) => {
    try {
      const response = await testimonialService.update(testimonialId, updates);
      alert.success(
        response.data?.message || "Testimonial updated successfully",
      );
      await refetchTestimonials();
    } catch (error) {
      console.error("Error updating testimonial:", error);
      alert.error(
        error.response?.data?.message || "Failed to update testimonial",
      );
    }
  };

  // ✅ FIXED: Admin delete testimonial with consistent response handling
  const handleDeleteTestimonial = async (testimonialId) => {
    try {
      const response = await testimonialService.delete(testimonialId);
      alert.success(
        response.data?.message || "Testimonial deleted successfully",
      );
      await refetchTestimonials();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      alert.error(
        error.response?.data?.message || "Failed to delete testimonial",
      );
    }
  };

  const handleVideoPlay = (video) => {
    console.log('🎬 Video selected:', {
      title: video.title,
      videoUrl: video.videoUrl || video.videoFile,
      hasVideo: !!(video.videoUrl || video.videoFile)
    });

    // Show a proper message instead of the generic alert
    if (!video.videoUrl && !video.videoFile) {
      alert.info('This video testimony does not have a video file attached.');
    }
  };


  if (isLoading) {
    return <PageLoader type="spinner" text="Loading testimonials..." />;
  }

  return (
    <div className="page">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] py-12 px-4">
        <div className="container mx-auto text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Testimonials</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Stories of how God is working in the lives of our church family
          </p>

          {/* ✅ Admin Controls */}
          {isAdmin && testimonialStats && (
            <div className="mt-6 space-x-4">
              <div className="bg-white text-[#FF7E45] px-6 py-2 rounded-lg font-semibold inline-block">
                Stats: {testimonialStats.totalTestimonials} Total,{" "}
                {testimonialStats.approvedTestimonials} Approved
              </div>
              {testimonials.length > 0 && (
                <>
                  <button
                    onClick={() =>
                      handleUpdateTestimonial(testimonials[0].id, {
                        status: "approved",
                      })
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Approve First
                  </button>
                  <button
                    onClick={() => handleDeleteTestimonial(testimonials[0].id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Delete First
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 underline mt-2"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {submissionSuccess && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600">
              <i className="fas fa-check-circle mr-2" />
              Thank you for sharing your story! Your testimonial will be
              reviewed before publishing.
            </p>
          </div>
        </div>
      )}

      {/* Featured Testimonials */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">What People Are Saying</h2>
            <p className="text-gray-600">
              Real stories from real people in our community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>

          {testimonials.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <i className="fas fa-comments text-4xl text-gray-400 mb-4" />
              <p className="text-gray-600">
                No testimonials yet. Be the first to share your story!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Video Testimonials */}
      <VideoTestimonialsSection
        videos={videoTestimonials}
        onVideoPlay={handleVideoPlay}
      />

      {/* Share Your Story CTA */}
      <ShareStorySection onSubmit={() => setShowSubmitForm(true)} />

      {/* Submission Form */}
      {showSubmitForm && (
        <TestimonialFormModal
          onClose={() => {
            setShowSubmitForm(false);
            setError(null);
            setSubmissionSuccess(false);
          }}
          onSubmit={handleSubmitTestimonial}
          error={error}
          categories={categories}
        />
      )}
    </div>
  );
};

// Testimonial Card Component
const TestimonialCard = ({ testimonial }) => (
  <div className="testimonial-card bg-white rounded-lg shadow-md p-6 flex flex-col h-full hover:shadow-lg transition-shadow">
    <div className="mb-4 text-[#FF7E45]">
      <i className="fas fa-quote-left text-3xl" />
    </div>
    <p className="flex-grow text-gray-700 italic mb-6">{testimonial.content}</p>
    <div className="flex items-center mt-auto">
      <img
        src={
          testimonial.imageUrl ||
          "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
        }
        alt={testimonial.name}
        className="w-12 h-12 rounded-full object-cover mr-4"
        onError={(e) => {
          e.target.src =
            "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
        }}
      />
      <div>
        <h4 className="font-semibold">{testimonial.name}</h4>
        <p className="text-sm text-gray-600">{testimonial.relationship}</p>
      </div>
    </div>
  </div>
);

// Video Testimonials Section Component
const VideoTestimonialsSection = ({ videos, onVideoPlay }) => {
  const [playingVideo, setPlayingVideo] = useState(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const handlePlayVideo = (video) => {
    console.log('🎬 Playing video:', video);
    setPlayingVideo(video);
    setVideoModalOpen(true);
    if (onVideoPlay) {
      onVideoPlay(video);
    }
  };

  const handleCloseVideo = () => {
    setPlayingVideo(null);
    setVideoModalOpen(false);
  };

  // ✅ FIXED: Use SVG placeholder instead of broken URL
  const getThumbnailUrl = (video) => {
    const thumbnail = video.imageUrl || video.thumbnail;


    if (thumbnail &&
      !thumbnail.includes('placeholder.com') &&
      !thumbnail.includes('via.placeholder.com') &&
      thumbnail.startsWith('/')) {
      return thumbnail;
    }
    // Use SVG placeholder instead of broken URL
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="300" height="169" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ff7d45"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="14" fill="white">
          Video Thumbnail
        </text>
      </svg>
    `)}`;
  };

  const ThumbnailFallback = ({ title, author }) => (
    <div className="absolute inset-0 bg-gradient-to-br from-[#FF7E45] to-[#F4B942] flex items-center justify-center text-white p-4">
      <div className="text-center">
        <i className="fas fa-video text-3xl mb-3"></i>
        <p className="font-semibold text-sm mb-1">{title || 'Video Testimony'}</p>
        {author && <p className="text-xs opacity-80">By: {author}</p>}
      </div>
    </div>
  );

  return (
    <>
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Video Stories</h2>
            <p className="text-gray-600">
              Watch video testimonials from our church family
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos && videos.map((video) => {
              const thumbnailUrl = getThumbnailUrl(video);

              return (
                <div key={video._id || video.id || Math.random().toString()}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div
                    className="relative cursor-pointer"
                    onClick={() => handlePlayVideo(video)}
                  >
                    <div className="w-full h-0 pb-[56.25%] relative bg-gray-200">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={video.title || 'Video testimony'}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            // If image fails, show fallback
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            parent.innerHTML = '';
                            parent.appendChild(document.createElement('div')).className = 'absolute inset-0';
                          }}
                        />
                      ) : (
                        <ThumbnailFallback
                          title={video.title}
                          author={video.author || video.name}
                        />
                      )}

                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-[#00000080] bg-opacity-30 flex items-center justify-center hover:bg-opacity-20 transition-all">
                        <div className="w-16 h-16 bg-[#FF7E45] text-white rounded-full flex items-center justify-center transform hover:scale-110 transition-transform">
                          <i className="fas fa-play text-2xl ml-1"></i>
                        </div>
                      </div>

                      {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">
                      {video.title || 'Video Testimony'}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {video.description || video.content || 'Personal testimony'}
                    </p>
                    {video.author && (
                      <p className="text-xs text-gray-500 mt-2">
                        By: {video.author}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {(!videos || videos.length === 0) && (
            <div className="text-center py-12">
              <i className="fas fa-video text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600">No video testimonials available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* ✅ FIXED: Video Modal for actual playback */}
      {videoModalOpen && playingVideo && (
        <VideoPlayerModal
          video={playingVideo}
          onClose={handleCloseVideo}
        />
      )}
    </>
  );
};

// Share Story Section Component
const ShareStorySection = ({ onSubmit }) => (
  <section className="py-12">
    <div className="container mx-auto px-4 text-center border-t border-gray-200 pt-12">
      <h2 className="text-3xl font-bold mb-4">Share Your Story</h2>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Has God worked in your life through our church? We'd love to hear about
        it!
      </p>
      <button
        onClick={onSubmit}
        className="btn btn-primary px-6 py-3 bg-[#FF7E45] text-white rounded-lg font-semibold hover:bg-[#FF7E45]/90 transition-colors flex items-center justify-center mx-auto"
      >
        Submit Your Testimonial
      </button>
    </div>
  </section>
);

// Testimonial Form Modal Component (UNCHANGED - no endpoint issues here)
const TestimonialFormModal = ({ onClose, onSubmit, error, categories = [] }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    relationship: "member",
    content: "",
    category: "other",
    image: null,
    video: null,
    allowSharing: false,
    allowContact: false,
    yearsInChurch: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create FormData object for file upload
      const submitData = new FormData();

      // Append all form fields
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('relationship', formData.relationship);
      submitData.append('content', formData.content);
      submitData.append('category', formData.category);
      submitData.append('allowSharing', formData.allowSharing);
      submitData.append('allowContact', formData.allowContact);
      submitData.append('yearsInChurch', formData.yearsInChurch);

      // Append files if they exist
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      if (formData.video) {
        submitData.append('video', formData.video);
      }

      console.log('📤 Submitting testimonial form data:', {
        name: formData.name,
        email: formData.email,
        relationship: formData.relationship,
        category: formData.category,
        hasImage: !!formData.image,
        hasVideo: !!formData.video,
        allowSharing: formData.allowSharing,
        allowContact: formData.allowContact
      });

      await onSubmit(submitData);

    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (file) {
      setFormData((prev) => ({ ...prev, [name]: file }));

      // Create preview for images
      if (name === 'image' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
      }

      // Create preview for videos
      if (name === 'video' && file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => setVideoPreview(e.target.result);
        reader.readAsDataURL(file);
      }
    } else {
      // Clear preview if file is removed
      if (name === 'image') {
        setImagePreview(null);
      }
      if (name === 'video') {
        setVideoPreview(null);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const clearFile = (fileType) => {
    if (fileType === 'image') {
      setFormData(prev => ({ ...prev, image: null }));
      setImagePreview(null);
      // Reset file input
      const fileInput = document.getElementById('testimonial-photo');
      if (fileInput) fileInput.value = '';
    }
    if (fileType === 'video') {
      setFormData(prev => ({ ...prev, video: null }));
      setVideoPreview(null);
      // Reset file input
      const fileInput = document.getElementById('testimonial-video');
      if (fileInput) fileInput.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-[#333333e9] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Share Your Story</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              <i className="fas fa-times" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} encType="multipart/form-data">
            {/* Name Field */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Your Name *
              </label>
              <input
                type="text"
                name="name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Email Field */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Relationship Field */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Your Relationship to the Church
              </label>
              <select
                name="relationship"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                value={formData.relationship}
                onChange={handleInputChange}
                disabled={isSubmitting}
              >
                <option value="member">Member</option>
                <option value="visitor">Visitor</option>
                <option value="volunteer">Volunteer</option>
                <option value="staff">Staff</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Years in Church */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Years in Church
              </label>
              <input
                type="number"
                name="yearsInChurch"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                value={formData.yearsInChurch}
                onChange={handleInputChange}
                min="0"
                disabled={isSubmitting}
                placeholder="0"
              />
            </div>

            {/* Category Field */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Category
              </label>
              <select
                name="category"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                value={formData.category}
                onChange={handleInputChange}
                disabled={isSubmitting}
              >
                <option value="salvation">Salvation</option>
                <option value="healing">Healing</option>
                <option value="provision">Provision</option>
                <option value="relationship">Relationship</option>
                <option value="answered-prayer">Answered Prayer</option>
                <option value="favour">Favour</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Story Content */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Your Story *
              </label>
              <textarea
                name="content"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                rows="5"
                placeholder="Share how God has worked in your life through our church..."
                value={formData.content}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              ></textarea>
            </div>

            {/* Photo Upload */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Photo (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#FF7E45] transition-colors">
                <input
                  type="file"
                  className="hidden"
                  id="testimonial-photo"
                  accept="image/*"
                  onChange={handleFileChange}
                  name="image"
                  disabled={isSubmitting}
                />
                <label htmlFor="testimonial-photo" className="cursor-pointer block">
                  <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-3"></i>
                  <p className="text-sm text-gray-500 mb-2">
                    Click to upload a photo or drag and drop
                  </p>
                  <span className="text-[#FF7E45] text-sm font-medium">
                    {formData.image ? formData.image.name : 'Choose file'}
                  </span>
                </label>

                {imagePreview && (
                  <div className="mt-4 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => clearFile('image')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}

                {formData.image && !imagePreview && (
                  <div className="mt-3 flex items-center justify-center space-x-2">
                    <span className="text-green-600 text-sm">✓ {formData.image.name}</span>
                    <button
                      type="button"
                      onClick={() => clearFile('image')}
                      className="text-red-500 text-sm"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Video Upload */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Video Testimony (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#FF7E45] transition-colors">
                <input
                  type="file"
                  className="hidden"
                  id="testimonial-video"
                  accept="video/mp4,video/quicktime,video/x-msvideo"
                  onChange={handleFileChange}
                  name="video"
                  disabled={isSubmitting}
                />
                <label htmlFor="testimonial-video" className="cursor-pointer block">
                  <i className="fas fa-video text-3xl text-gray-400 mb-3"></i>
                  <p className="text-sm text-gray-500 mb-2">
                    Upload your testimony video (.mp4, .mov, .avi)
                  </p>
                  <span className="text-[#FF7E45] text-sm font-medium">
                    {formData.video ? formData.video.name : 'Choose video'}
                  </span>
                </label>

                {videoPreview && (
                  <div className="mt-4 relative">
                    <video
                      src={videoPreview}
                      className="w-32 h-32 object-cover rounded-lg mx-auto"
                      controls
                    />
                    <button
                      type="button"
                      onClick={() => clearFile('video')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}

                {formData.video && !videoPreview && (
                  <div className="mt-3 flex items-center justify-center space-x-2">
                    <span className="text-green-600 text-sm">🎬 {formData.video.name}</span>
                    <button
                      type="button"
                      onClick={() => clearFile('video')}
                      className="text-red-500 text-sm"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="allowSharing"
                  className="mt-1 mr-3 text-[#FF7E45] focus:ring-[#FF7E45]"
                  id="permission"
                  checked={formData.allowSharing}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="permission"
                  className="text-sm text-gray-600 flex-1"
                >
                  I give permission for the church to share my story on their website and social media. *
                </label>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="allowContact"
                  className="mt-1 mr-3 text-[#FF7E45] focus:ring-[#FF7E45]"
                  id="contact"
                  checked={formData.allowContact}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="contact"
                  className="text-sm text-gray-600 flex-1"
                >
                  I allow the church to contact me for more information about my story.
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 bg-[#FF7E45] text-white rounded-lg font-medium hover:bg-[#F4B942] transition-colors flex items-center justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 018 8h-4l3.5 3.5L20 12h-4a8 8 0 01-8 8v-4l-3.5 3.5L12 20v-4a8 8 0 01-8-8z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Testimonial'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ✅ NEW: Video Player Modal Component
const VideoPlayerModal = ({ video, onClose }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);


  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onClose();
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };


  // ✅ FIXED: Get actual video URL from different possible fields
  const getVideoUrl = () => {
    const videoUrl = video.videoUrl || video.videoFile || video.url || video.source;

    console.log('🔍 Original video URL:', videoUrl);

    if (!videoUrl) {
      setErrorMessage('No video file available');
      setHasError(true);
      return null;
    }

    // Check if URL is valid and has proper extension
    const isValidVideoUrl = (url) => {
      if (!url) return false;

      // Check for common video extensions
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
      const hasExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));

      // Also check if it's a data URL or blob URL
      const isDataUrl = url.startsWith('data:');
      const isBlobUrl = url.startsWith('blob:');

      return hasExtension || isDataUrl || isBlobUrl;
    };

    if (!isValidVideoUrl(videoUrl)) {
      console.warn('⚠️ Invalid video URL - missing extension:', videoUrl);
      setErrorMessage('Video file format not recognized');
      setHasError(true);
      return null;
    }

    // Handle relative paths - add base URL if needed
    let finalUrl = videoUrl;
    if (videoUrl.startsWith('/') && !videoUrl.startsWith('//')) {
      finalUrl = `${window.location.origin}${videoUrl}`;
    }

    console.log('✅ Final video URL:', finalUrl);
    return finalUrl;
  };

  const videoUrl = getVideoUrl();


  const handleRetry = () => {
    const videoElement = document.querySelector('video');
    const errorMsg = document.querySelector('.video-error-message');

    if (errorMsg) {
      errorMsg.remove();
    }

    if (videoElement) {
      videoElement.style.display = 'block';
      setHasError(false);
      setErrorMessage('');
      setIsLoading(true);

      // Add a small delay before retry to ensure DOM is updated
      setTimeout(() => {
        videoElement.load();
        videoElement.play().catch(err => {
          console.log('Retry play failed:', err);
        });
      }, 100);
    }
  };

  const handleManualPlay = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Manual play failed:', error);
        setErrorMessage('Failed to play video: ' + error.message);
        setHasError(true);
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ FIXED: Handle video playback errors
  const handleVideoError = (e) => {
    console.error('Video playback error:', e);
    setIsLoading(false);
    setHasError(true);

    const videoElement = e.target;
    const error = videoElement.error;

    let errorMessage = 'Unable to load video file';
    let detailedMessage = 'The video file may be unavailable or in an unsupported format.';
    let errorType = 'unknown';

    // Determine specific error type
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMessage = 'Video playback was aborted';
          detailedMessage = 'The video loading was interrupted. Please try playing it again.';
          errorType = 'aborted';
          break;
        case error.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error occurred';
          detailedMessage = 'There was a network issue while loading the video. Please check your internet connection and try again.';
          errorType = 'network';
          break;
        case error.MEDIA_ERR_DECODE:
          errorMessage = 'Video format error';
          detailedMessage = 'The video file appears to be corrupted or in an unsupported format. Try using MP4 format for best compatibility.';
          errorType = 'decode';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video format not supported';
          detailedMessage = 'Your browser does not support this video format. Please try using Chrome, Firefox, or Safari.';
          errorType = 'unsupported';
          break;
        default:
          errorMessage = 'An error occurred while playing the video';
          detailedMessage = 'Please try refreshing the page or using a different browser.';
          errorType = 'unknown';
      }
    }

    // Set state for React component
    setErrorMessage(errorMessage);

    // Create visual error message in DOM
    showErrorUI(videoElement, errorMessage, detailedMessage, errorType);

    // Log detailed error information
    logErrorDetails(videoElement, error, errorType);
  };

  const showErrorUI = (videoElement, errorMessage, detailedMessage, errorType) => {
    const errorContainer = videoElement.parentNode;

    // Remove any existing error messages
    const existingError = errorContainer.querySelector('.video-error-message');
    if (existingError) {
      existingError.remove();
    }

    // Get appropriate icon based on error type
    const getErrorIcon = (type) => {
      switch (type) {
        case 'network': return 'fa-wifi';
        case 'decode': return 'fa-file-video';
        case 'unsupported': return 'fa-ban';
        case 'aborted': return 'fa-stop-circle';
        default: return 'fa-exclamation-triangle';
      }
    };

    const errorMsg = document.createElement('div');
    errorMsg.className = 'video-error-message absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10';
    errorMsg.innerHTML = `
    <div class="text-center p-6 max-w-sm">
      <i class="fas ${getErrorIcon(errorType)} text-3xl text-yellow-500 mb-3"></i>
      <p class="text-gray-800 font-medium text-lg mb-2">${errorMessage}</p>
      <p class="text-sm text-gray-600 mb-4">${detailedMessage}</p>
      
      ${errorType === 'network' ? `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
          <p class="text-sm text-blue-700">
            <i class="fas fa-lightbulb mr-1"></i>
            <strong>Tip:</strong> Check your internet connection and try again.
          </p>
        </div>
      ` : ''}
      
      ${errorType === 'unsupported' ? `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
          <p class="text-sm text-blue-700">
            <i class="fas fa-lightbulb mr-1"></i>
            <strong>Tip:</strong> Try using MP4 format with H.264 encoding.
          </p>
        </div>
      ` : ''}

      <div class="flex flex-col sm:flex-row gap-2 justify-center">
        <button class="retry-btn px-4 py-2 bg-[#FF7E45] text-white rounded-lg hover:bg-[#F4B942] transition-colors font-medium">
          <i class="fas fa-redo mr-2"></i>Try Again
        </button>
        <button class="close-btn px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium">
          <i class="fas fa-times mr-2"></i>Close
        </button>
      </div>
    </div>
  `;

    // Add event listeners
    const retryBtn = errorMsg.querySelector('.retry-btn');
    const closeBtn = errorMsg.querySelector('.close-btn');

    retryBtn.addEventListener('click', handleRetry);
    closeBtn.addEventListener('click', handleClose);

    videoElement.style.display = 'none';
    errorContainer.appendChild(errorMsg);
  };

  const logErrorDetails = (videoElement, error, errorType) => {
    console.group('🎥 Video Error Analysis');
    console.log('Error Type:', errorType);
    console.log('Error Code:', error?.code);
    console.log('Error Message:', error?.message);
    console.log('Video Source:', videoElement.src);
    console.log('Video Duration:', videoElement.duration);
    console.log('Network State:', getNetworkStateText(videoElement.networkState));
    console.log('Ready State:', getReadyStateText(videoElement.readyState));
    console.log('Video Dimensions:', `${videoElement.videoWidth}x${videoElement.videoHeight}`);
    console.groupEnd();

    if (errorType === 'network') {
      console.log('🔧 Network Troubleshooting:');
      console.log('- Test URL accessibility in browser');
      console.log('- Check server CORS headers');
      console.log('- Verify file exists on server');
    }
  };

  // Helper functions for state text
  const getNetworkStateText = (state) => {
    const states = ['NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_NO_SOURCE'];
    return states[state] || 'UNKNOWN';
  };

  const getReadyStateText = (state) => {
    const states = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'];
    return states[state] || 'UNKNOWN';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            {video.title || 'Video Testimony'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-4">
          {videoUrl && !hasError ? (
            <div className="relative w-full h-0 pb-[56.25%] bg-black rounded-lg overflow-hidden">
              {/* Video Element */}
              <video
                ref={videoRef}
                controls
                className="absolute inset-0 w-full h-full"
                poster={video.thumbnail || video.imageUrl}
                onError={handleVideoError}
                onPlay={handlePlay}
                onPause={handlePause}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onLoadStart={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
                preload="metadata"
                playsInline
              >
                <source src={videoUrl} type="video/mp4" />
                <source src={videoUrl} type="video/webm" />
                <source src={videoUrl} type="video/ogg" />
                Your browser does not support the video tag.
              </video>

              {/* Loading Spinner */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="w-16 h-16 border-4 border-[#FF7E45] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Custom play button for better UX */}
              {!isPlaying && !isLoading && (
                <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-[#333332a5] bg-opacity-20 cursor-pointer z-10"
                  onClick={handleManualPlay}>
                  <div className="text-center transform -translate-y-2"> {/* minor vertical adjustment */}
                    <div className="w-20 h-20 bg-[#FF7E45] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform mb-4 mx-auto">
                      <i className="fas fa-play text-3xl ml-1"></i>
                    </div>
                    <p className="text-white font-medium">Click to play video</p>
                  </div>
                </div>
              )}

              {/* Video info overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white text-sm">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-100 rounded-lg">
              {hasError ? (
                <>
                  <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                  <p className="text-gray-800 font-medium text-lg mb-2">Unable to play video</p>
                  <p className="text-gray-600 mb-4">{errorMessage}</p>

                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                      Troubleshooting tips:
                    </p>
                    <ul className="text-sm text-gray-500 text-left max-w-md mx-auto space-y-1">
                      <li>• Check your internet connection</li>
                      <li>• Try using a different browser</li>
                      <li>• Ensure the video file is not corrupted</li>
                      <li>• Video format should be MP4, WebM, or OGG</li>
                    </ul>
                  </div>

                  <div className="flex justify-center space-x-3 mt-6">
                    <button
                      onClick={handleRetry}
                      className="px-6 py-2 bg-[#FF7E45] text-white rounded-lg hover:bg-[#F4B942] transition-colors font-medium"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleClose}
                      className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <i className="fas fa-exclamation-circle text-4xl text-yellow-500 mb-4"></i>
                  <p className="text-gray-800 font-medium text-lg mb-2">Video file not available</p>
                  <p className="text-gray-600 mb-4">
                    This testimony doesn't have a video file attached or the file is unavailable.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-[#FF7E45] text-white rounded-lg hover:bg-[#F4B942] transition-colors font-medium"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Video Information */}
        {(video.description || video.author) && (
          <div className="p-4 border-t bg-gray-50">
            {video.description && (
              <p className="text-gray-700 mb-3">{video.description}</p>
            )}
            {video.author && (
              <p className="text-sm text-gray-600">
                <strong>By:</strong> {video.author}
              </p>
            )}
            {videoUrl && !hasError && (
              <div className="mt-2 text-xs text-gray-500">
                <strong>Video URL:</strong> <span className="font-mono truncate">{videoUrl}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestimonialsPage;
