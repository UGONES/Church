import React, { useState, useEffect } from "react";
import { apiClient } from "../utils/api";
import Loader from "../components/Loader";
import { useAlert } from "../utils/Alert";
import { Testimonial } from "../models/Testimonial";

const TestimonialsPage = ({ user }) => {
  const alert = useAlert();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [videoTestimonials, setVideoTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  const [testimonialStats, setTestimonialStats] = useState(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    document.title =
      "SMC: - Testimonies | St. Micheal`s & All Angels Church | Ifite-Awka";

    fetchTestimonials();
    fetchVideoTestimonials();
    fetchCategories();
    if (isAdmin) {
      fetchAllTestimonials();
      fetchTestimonialStats();
    }
  }, [isAdmin]);

  const fetchTestimonials = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get("/api/testimonials");
      if (response.success) {
        setTestimonials(
          response.data.map((testimonial) => new Testimonial(testimonial)),
        );
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      setError("Failed to load testimonials. Please try again later.");
      alert.error("Failed to load testimonials. Please try again later.");
      setTestimonials([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVideoTestimonials = async () => {
    try {
      const response = await apiClient.get("/api/testimonials/videos");
      if (response.success) {
        setVideoTestimonials(response.data);
      }
    } catch (error) {
      console.error("Error fetching video testimonials:", error);
      setVideoTestimonials([]);
      alert.error("Failed to load video testimonials.");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/api/testimonials/categories");
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchAllTestimonials = async () => {
    try {
      const response = await apiClient.get("/api/admin/testimonials");
      if (response.success) {
        // Handle all testimonials for admin
      }
    } catch (error) {
      console.error("Error fetching all testimonials:", error);
    }
  };

  const fetchTestimonialStats = async () => {
    try {
      const response = await apiClient.get("/api/admin/testimonials/stats");
      if (response.success) {
        setTestimonialStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching testimonial stats:", error);
    }
  };

  const handleSubmitTestimonial = async (formData) => {
    try {
      setError(null);
      const response = await apiClient.post("/api/testimonials", formData);

      if (response.success) {
        setSubmissionSuccess(true);
        setShowSubmitForm(false);
        fetchTestimonials();
        alert.success("Testimonial submitted successfully!");
      } else {
        setError(response.message || "Failed to submit testimonial");
        alert.error(response.message || "Failed to submit testimonial");
      }
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      setError("Failed to submit testimonial. Please try again.");
      alert.error("Failed to submit testimonial. Please try again.");
    }
  };

  // Admin functions
  const handleUpdateTestimonial = async (testimonialId, updates) => {
    try {
      const response = await apiClient.put(
        `/api/admin/testimonials/${testimonialId}`,
        updates,
      );
      if (response.success) {
        alert.success("Testimonial updated successfully");
        fetchTestimonials();
      }
    } catch (error) {
      console.error("Error updating testimonial:", error);
      alert.error("Failed to update testimonial");
    }
  };

  const handleDeleteTestimonial = async (testimonialId) => {
    try {
      const response = await apiClient.delete(
        `/api/admin/testimonials/${testimonialId}`,
      );
      if (response.success) {
        alert.success("Testimonial deleted successfully");
        fetchTestimonials();
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      alert.error("Failed to delete testimonial");
    }
  };

  const handleVideoPlay = (video) => {
    // Open video in modal or new page
    console.log("Playing video:", video);
    alert.info("Video playback feature would open here");
  };

  if (isLoading) {
    return <Loader type="spinner" text="Loading testimonials..." />;
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

          {/* Admin Controls */}
          {isAdmin && (
            <div className="mt-6">
              <button
                onClick={() => {
                  // Navigate to testimonial management
                  alert("Testimonial management feature would open here");
                }}
                className="bg-white text-[#FF7E45] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-cog mr-2" />
                Manage Testimonials
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
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

      {/* Testimonial Submission Form */}
      {showSubmitForm && (
        <TestimonialFormModal
          onClose={() => {
            setShowSubmitForm(false);
            setError(null);
            setSubmissionSuccess(false);
          }}
          onSubmit={handleSubmitTestimonial}
          error={error}
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
        src={testimonial.image}
        alt={testimonial.name}
        className="w-12 h-12 rounded-full object-cover mr-4"
        onError={(e) => {
          e.target.src =
            "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
        }}
      />
      <div>
        <h4 className="font-semibold">{testimonial.name}</h4>
        <p className="text-sm text-gray-600">{testimonial.membership}</p>
      </div>
    </div>
  </div>
);

// Video Testimonials Section Component
const VideoTestimonialsSection = ({ videos, onVideoPlay }) => (
  <section className="py-12 bg-gray-50">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2">Video Stories</h2>
        <p className="text-gray-600">
          Watch video testimonials from our church family
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div
              className="relative cursor-pointer"
              onClick={() => onVideoPlay(video)}
            >
              <div className="w-full h-0 pb-[56.25%] relative bg-gray-200">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="w-16 h-16 bg-[#FF7E45] text-white rounded-full flex items-center justify-center">
                    <i className="fas fa-play text-2xl" />
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
              <h3 className="font-bold text-lg mb-1">{video.title}</h3>
              <p className="text-sm text-gray-600">{video.description}</p>
            </div>
          </div>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-video text-4xl text-gray-400 mb-4" />
          <p className="text-gray-600">No video testimonials available yet.</p>
        </div>
      )}
    </div>
  </section>
);

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

// Testimonial Form Modal Component
const TestimonialFormModal = ({ onClose, onSubmit, error }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    relationship: "",
    content: "",
    image: null,
    allowSharing: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Share Your Story</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Your Name *
              </label>
              <input
                type="text"
                className="form-input flex flex-grow w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                className="form-input flex flex-grow w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Your Relationship to the Church
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Member since 2020, Visitor, etc."
                value={formData.relationship}
                onChange={(e) =>
                  setFormData({ ...formData, relationship: e.target.value })
                }
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Your Story *
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                rows="5"
                placeholder="Share how God has worked in your life through our church..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Photo (Optional)
              </label>
              <div className="border border-dashed border-gray-300 rounded-md py-4 px-6 text-center cursor-pointer">
                <i className="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  Click to upload a photo or drag and drop
                </p>
                <input
                  type="file"
                  className="hidden"
                  id="testimonial-photo"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <label htmlFor="testimonial-photo" className="cursor-pointer">
                  {formData.image ? formData.image.name : "Choose file"}
                </label>
              </div>
            </div>

            <div className="flex items-start mb-6">
              <input
                type="checkbox"
                className="mt-1 mr-2 text-[#FF7E45] "
                id="permission"
                checked={formData.allowSharing}
                onChange={(e) =>
                  setFormData({ ...formData, allowSharing: e.target.checked })
                }
                required
              />
              <label htmlFor="permission" className="text-sm text-gray-600 ">
                I give permission for the church to share my story on their
                website and social media.
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn bg-gray-200 p-2 border border-gray-300 rounded-md text-gray-800 hover:bg-gray-300 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary p-2 border border-transparent rounded-md text-white bg-[#FF7E45] hover:bg-[#FF7E45]/80"
              >
                Submit Story
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsPage;
