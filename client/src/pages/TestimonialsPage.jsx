import { useState, useEffect } from "react";
import { testimonialService } from '../services/apiService';
import Loader, { ContentLoader } from '../components/Loader';
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
    document.title = "SMC: - Testimonies | St. Micheal`s & All Angels Church | Ifite-Awka";

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch public data in parallel
        const [testimonialsResponse, videosResponse, categoriesResponse] = await Promise.allSettled([
          testimonialService.getAll(),
          testimonialService.getVideos(),
          testimonialService.getCategories()
        ]);

        // ✅ FIXED: Handle testimonials response consistently
        if (testimonialsResponse.status === 'fulfilled') {
          const response = testimonialsResponse.value;
          // Handle both direct array and { data: array } responses
          const testimonialsData = Array.isArray(response) ? response :
            (response.data || []);
          setTestimonials(testimonialsData.map(t => new Testimonial(t)));
        } else {
          console.error('Failed to fetch testimonials:', testimonialsResponse.reason);
          setTestimonials([]);
        }

        // ✅ FIXED: Handle videos response consistently
        if (videosResponse.status === 'fulfilled') {
          const response = videosResponse.value;
          const videosData = Array.isArray(response) ? response :
            (response.data || []);
          setVideoTestimonials(videosData);
        } else {
          console.error('Failed to fetch video testimonials:', videosResponse.reason);
          setVideoTestimonials([]);
        }

        // ✅ FIXED: Handle categories response consistently
        if (categoriesResponse.status === 'fulfilled') {
          const response = categoriesResponse.value;
          const categoriesData = Array.isArray(response) ? response :
            (response.data || []);
          setCategories(categoriesData);
        } else {
          console.error('Failed to fetch categories:', categoriesResponse.reason);
          setCategories([]);
        }

        // Fetch admin data if user is admin
        if (isAdmin) {
          try {
            const [allResponse, statsResponse] = await Promise.allSettled([
              testimonialService.getAllAdmin(),
              testimonialService.getStats()
            ]);

            // ✅ FIXED: Handle admin responses consistently
            if (statsResponse.status === 'fulfilled') {
              const response = statsResponse.value;
              setTestimonialStats(response.data || response);
            }
          } catch (adminError) {
            console.error('Error fetching admin data:', adminError);
          }
        }

      } catch (error) {
        console.error('Error in fetchData:', error);
        const errorMsg = error.response?.data?.message || "Failed to load testimonials. Please try again later.";
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
      // Handle both direct array and { data: array } responses
      const testimonialsData = Array.isArray(response) ? response :
        (response.data || []);
      setTestimonials(testimonialsData.map(t => new Testimonial(t)));
    } catch (error) {
      console.error('Error refetching testimonials:', error);
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
        alert.success(response.data?.message || 'Testimonial submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      const errorMsg = error.response?.data?.message || "Failed to submit testimonial. Please try again.";
      setError(errorMsg);
      alert.error(errorMsg);
    }
  };

  // ✅ FIXED: Admin update testimonial with consistent response handling
  const handleUpdateTestimonial = async (testimonialId, updates) => {
    try {
      const response = await testimonialService.update(testimonialId, updates);
      alert.success(response.data?.message || 'Testimonial updated successfully');
      await refetchTestimonials();
    } catch (error) {
      console.error('Error updating testimonial:', error);
      alert.error(error.response?.data?.message || 'Failed to update testimonial');
    }
  };

  // ✅ FIXED: Admin delete testimonial with consistent response handling
  const handleDeleteTestimonial = async (testimonialId) => {
    try {
      const response = await testimonialService.delete(testimonialId);
      alert.success(response.data?.message || 'Testimonial deleted successfully');
      await refetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert.error(error.response?.data?.message || 'Failed to delete testimonial');
    }
  };

  const handleVideoPlay = (video) => {
    console.log('Playing video:', video);
    alert.info('Video playback feature would open here');
  };

  if (isLoading) {
    return <ContentLoader type="spinner" text="Loading testimonials..." />;
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
                Stats: {testimonialStats.totalTestimonials} Total, {testimonialStats.approvedTestimonials} Approved
              </div>
              {testimonials.length > 0 && (
                <>
                  <button
                    onClick={() => handleUpdateTestimonial(testimonials[0].id, { status: 'approved' })}
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
              <i className="fas fa-check-circle mr-2"></i>
              Thank you for sharing your story! Your testimonial will be reviewed before publishing.
            </p>
          </div>
        </div>
      )}

      {/* Featured Testimonials */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">What People Are Saying</h2>
            <p className="text-gray-600">Real stories from real people in our community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>

          {testimonials.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <i className="fas fa-comments text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600">No testimonials yet. Be the first to share your story!</p>
            </div>
          )}
        </div>
      </section>

      {/* Video Testimonials */}
      <VideoTestimonialsSection videos={videoTestimonials} onVideoPlay={handleVideoPlay} />

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
      <i className="fas fa-quote-left text-3xl"></i>
    </div>
    <p className="flex-grow text-gray-700 italic mb-6">
      {testimonial.content}
    </p>
    <div className="flex items-center mt-auto">
      <img
        src={testimonial.imageUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
        alt={testimonial.name}
        className="w-12 h-12 rounded-full object-cover mr-4"
        onError={(e) => {
          e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
        }}
      />
      <div>
        <h4 className="font-semibold">{testimonial.name}</h4>
        <p className="text-sm text-gray-600">
          {testimonial.relationship}
        </p>
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
          <div key={video._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative cursor-pointer" onClick={() => onVideoPlay(video)}>
              <div className="w-full h-0 pb-[56.25%] relative bg-gray-200">
                <img
                  src={video.thumbnail || 'https://via.placeholder.com/300x169'}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="w-16 h-16 bg-[#FF7E45] text-white rounded-full flex items-center justify-center">
                    <i className="fas fa-play text-2xl"></i>
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
              <h3 className="font-bold text-lg mb-1">
                {video.title}
              </h3>
              <p className="text-sm text-gray-600">
                {video.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-video text-4xl text-gray-400 mb-4"></i>
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
        Has God worked in your life through our church? We'd love to hear about it!
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
const TestimonialFormModal = ({ onClose, onSubmit, error, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    relationship: 'member',
    content: '',
    category: 'other',
    image: null,
    allowSharing: false,
    allowContact: false,
    yearsInChurch: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Create FormData object for file upload
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        submitData.append(key, formData[key]);
      }
    });

    onSubmit(submitData);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
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
              <i className="fas fa-times"></i>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Your Name *
              </label>
              <input
                type="text"
                name="name"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Your Relationship to the Church
              </label>
              <select
                name="relationship"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                value={formData.relationship}
                onChange={handleInputChange}
              >
                <option value="member">Member</option>
                <option value="visitor">Visitor</option>
                <option value="volunteer">Volunteer</option>
                <option value="staff">Staff</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Years in Church
              </label>
              <input
                type="number"
                name="yearsInChurch"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                value={formData.yearsInChurch}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Category
              </label>
              <select
                name="category"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="salvation">Salvation</option>
                <option value="healing">Healing</option>
                <option value="provision">Provision</option>
                <option value="relationship">Relationship</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Your Story *
              </label>
              <textarea
                name="content"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                rows="5"
                placeholder="Share how God has worked in your life through our church..."
                value={formData.content}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Photo (Optional)
              </label>
              <div className="border border-dashed border-gray-300 rounded-md py-4 px-6 text-center cursor-pointer">
                <i className="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-2"></i>
                <p className="text-sm text-gray-500">
                  Click to upload a photo or drag and drop
                </p>
                <input
                  type="file"
                  className="hidden"
                  id="testimonial-photo"
                  accept="image/*"
                  onChange={handleImageChange}
                  name="image"
                />
                <label htmlFor="testimonial-photo" className="cursor-pointer">
                  {formData.image ? formData.image.name : 'Choose file'}
                </label>
              </div>
            </div>

            <div className="flex items-start mb-4">
              <input
                type="checkbox"
                name="allowSharing"
                className="mt-1 mr-2 text-[#FF7E45]"
                id="permission"
                checked={formData.allowSharing}
                onChange={handleInputChange}
                required
              />
              <label
                htmlFor="permission"
                className="text-sm text-gray-600"
              >
                I give permission for the church to share my story on their website and social media.
              </label>
            </div>

            <div className="flex items-start mb-6">
              <input
                type="checkbox"
                name="allowContact"
                className="mt-1 mr-2 text-[#FF7E45]"
                id="contact"
                checked={formData.allowContact}
                onChange={handleInputChange}
              />
              <label
                htmlFor="contact"
                className="text-sm text-gray-600"
              >
                I allow the church to contact me for more information about my story.
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-200 p-2 border border-gray-300 rounded-md text-gray-800 hover:bg-gray-300 mr-3"
              >
                Cancel
              </button>
              <button type="submit" className="p-2 border border-transparent rounded-md text-white bg-[#FF7E45] hover:bg-[#FF7E45]/80">
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