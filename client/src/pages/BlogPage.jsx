import { useState, useEffect } from "react";
import { blogService } from '../services/apiService';
import { useAlert } from '../utils/Alert';
import useAuth from "../hooks/useAuth";
import { BlogPost } from '../models/BlogPost';

const BlogPage = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);
  const [favoritePosts, setFavoritePosts] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const isAdmin = user?.role === "admin";
  const isAuthenticated = user?.isLoggedIn;
  const alert = useAlert();

  useEffect(() => {
    document.title = "SMC: - News | St. Micheal`s & All Angels Church | Ifite-Awka";
    fetchBlogPosts();
    fetchCategories();
    if (isAuthenticated) {
      fetchUserFavorites();
    }
  }, [isAuthenticated]);

  const fetchBlogPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await blogService.getAll();
      if (response.success) {
        setPosts(response.data.map(post => new BlogPost(post)));
      } else {
        throw new Error(response.message || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setError('Failed to load blog posts. Please try again later.');
      alert.error('Failed to load blog posts. Please try again later.');
      // Fallback to sample data
      setPosts([
        new BlogPost({
          id: 1,
          title: "Summer Camp Registration Now Open",
          excerpt: "Register your children for our annual summer camp experience. Limited spots available!",
          content: "Full article content would go here...",
          category: "events",
          date: "2025-06-01",
          imageUrl: "https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg",
          author: "Youth Ministry Team",
          status: "published",
          readTime: "5 min read",
          tags: ["summer", "camp", "youth"]
        }),
        // ... other sample posts
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await blogService.getCategories();
      if (response.success) {
        setCategories(["all", ...response.data]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(["all", "announcements", "events", "community", "missions"]);
    }
  };

  const fetchUserFavorites = async () => {
    try {
      const response = await blogService.getFavorites();
      if (response.success) {
        setFavoritePosts(new Set(response.data.map(fav => fav.postId)));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleAddToFavorites = async (postId) => {
    if (!isAuthenticated) {
      alert.info('Please log in to add to favorites');
      return;
    }

    try {
      if (favoritePosts.has(postId)) {
        const response = await blogService.removeFavorite(postId);
        if (response.success) {
          setFavoritePosts(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
          alert.success('Removed from favorites!');
        }
      } else {
        const response = await blogService.addFavorite(postId);
        if (response.success) {
          setFavoritePosts(prev => new Set(prev).add(postId));
          alert.success('Added to favorites!');
        }
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      alert.error('Failed to update favorites');
    }
  };

  const handleEditPost = (post) => {
    setCurrentPost(post);
    setShowEditModal(true);
  };

  const handleDeletePost = async (postId) => {
    alert.info('Are you sure you want to delete this post? This action cannot be undone.', {
      duration: 0,
      dismissible: true,
      position: 'top-center',
      onClose: async (confirmed) => {
        if (confirmed) {
          try {
            const response = await blogService.delete(postId);
            if (response.success) {
              setPosts(posts.filter(post => post.id !== postId));
              alert.success('Post deleted successfully');
            }
          } catch (error) {
            console.error('Error deleting post:', error);
            if (error.response?.status === 403) {
              alert.error('Permission denied. Only admins can delete posts.');
            } else {
              alert.error('Failed to delete post');
            }
          }
        }
      }
    });
  };

  const handleSavePost = async (postData) => {
    try {
      let response;
      if (postData.id) {
        response = await blogService.update(postData.id, postData);
      } else {
        response = await blogService.create({
          ...postData,
          date: new Date().toISOString().split('T')[0],
          status: 'published',
          readTime: '5 min read'
        });
      }

      if (response.success) {
        const savedPost = new BlogPost(response.data);
        if (postData.id) {
          setPosts(posts.map(post => post.id === postData.id ? savedPost : post));
          alert.success('Post updated successfully');
        } else {
          setPosts([...posts, savedPost]);
          alert.success('Post created successfully');
        }
        setShowEditModal(false);
        setShowCreateModal(false);
        setCurrentPost(null);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      if (error.response?.status === 403) {
        alert.error('Permission denied. Only admins can create/edit posts.');
      } else {
        alert.error('Failed to save post');
      }
    }
  };

  const handleNewsletterSubscribe = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;

    try {
      const response = await blogService.subscribeNewsletter(email);
      if (response.success) {
        alert.success('Successfully subscribed to newsletter!');
        e.target.reset();
      }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      alert.error('Failed to subscribe. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter posts based on selected category
  const filteredPosts = activeCategory === "all"
    ? posts
    : posts.filter((post) => post.category === activeCategory);

  return (
    <div className="page">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] py-12 px-4">
        <div className="container mx-auto text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Church News & Blog</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Stay updated with announcements, stories, and insights
          </p>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="mt-6">
              <button
                onClick={() => {
                  setCurrentPost({
                    title: '',
                    excerpt: '',
                    content: '',
                    category: 'announcements',
                    imageUrl: '',
                    author: user.name || '',
                    tags: []
                  });
                  setShowCreateModal(true);
                }}
                className="bg-white text-[#FF7E45] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>Create New Post
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

      {/* Blog Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Category Filter */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full transition-colors ${activeCategory === category
                  ? "bg-[#FF7E45] text-white"
                  : "bg-gray-100 hover:bg-gray-200"
                  }`}
                onClick={() => setActiveCategory(category)}
              >
                {category === "all"
                  ? "All Posts"
                  : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7E45] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading blog posts...</p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {filteredPosts.length > 0 && (
                <div className="mb-12">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/2 relative">
                        <img
                          src={filteredPosts[0].imageUrl}
                          alt={filteredPosts[0].title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg';
                          }}
                        />
                        {isAdmin && (
                          <div className="absolute top-4 right-4 flex space-x-2">
                            <button
                              onClick={() => handleEditPost(filteredPosts[0])}
                              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDeletePost(filteredPosts[0].id)}
                              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <span className="uppercase bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {filteredPosts[0].category}
                          </span>
                          <span className="mx-3">•</span>
                          <span>{formatDate(filteredPosts[0].date)}</span>
                          <span className="mx-3">•</span>
                          <span>{filteredPosts[0].readTime}</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">
                          {filteredPosts[0].title}
                        </h2>
                        <p className="text-gray-600 mb-6">
                          {filteredPosts[0].excerpt}
                        </p>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                              <i className="fas fa-user text-gray-400"></i>
                            </div>
                            <span className="text-sm text-gray-700">
                              {filteredPosts[0].author}
                            </span>
                          </div>
                          {isAuthenticated && (
                            <button
                              onClick={() => handleAddToFavorites(filteredPosts[0].id)}
                              className={`transition-colors ${favoritePosts.has(filteredPosts[0].id)
                                ? "text-[#FF7E45]"
                                : "text-gray-400 hover:text-[#FF7E45]"
                                }`}
                            >
                              <i className={`${favoritePosts.has(filteredPosts[0].id)
                                ? "fas fa-heart"
                                : "far fa-heart"
                                }`}></i>
                            </button>
                          )}
                        </div>
                        <button className="btn btn-primary self-start">
                          Read Full Article
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Blog Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.slice(1).map((post) => (
                  <div key={post.id} className="blog-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg';
                        }}
                      />
                      {isAdmin && (
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <button
                            onClick={() => handleEditPost(post)}
                            className="bg-blue-500 text-white p-1 rounded"
                          >
                            <i className="fas fa-edit text-sm"></i>
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="bg-red-500 text-white p-1 rounded"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <span className="uppercase bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {post.category}
                        </span>
                        <span className="mx-3">•</span>
                        <span>{formatDate(post.date)}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-3">{post.title}</h3>
                      <p className="text-gray-600 mb-4">{post.excerpt}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags?.map(tag => (
                          <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full mr-2 flex items-center justify-center">
                            <i className="fas fa-user text-gray-400 text-xs"></i>
                          </div>
                          <span className="text-sm text-gray-700">{post.author}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          {isAuthenticated && (
                            <button
                              onClick={() => handleAddToFavorites(post.id)}
                              className={`transition-colors ${favoritePosts.has(post.id)
                                ? "text-[#FF7E45]"
                                : "text-gray-400 hover:text-[#FF7E45]"
                                }`}
                            >
                              <i className={`${favoritePosts.has(post.id)
                                ? "fas fa-heart"
                                : "far fa-heart"
                                }`}></i>
                            </button>
                          )}
                          <button className="text-[#FF7E45] hover:text-[#F4B942] transition-colors">
                            Read More
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPosts.length === 0 && (
                <div className="text-center py-12">
                  <i className="fas fa-newspaper text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-600">No posts found in this category.</p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 bg-[#FF7E45] text-white px-6 py-2 rounded-lg hover:bg-[#FFA76A] transition-colors"
                    >
                      Create Your First Post
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Newsletter Signup */}
          <div className="mt-16 bg-[#F9F7F4] rounded-lg border text-gray-600 border-gray-200 shadow-ms p-8 bg-gradient-to-r from-[#FF7E45]/80 to-[#FFA76A]/60 text-center">
            <h3 className="text-2xl font-bold mb-3">
              Subscribe to Our Newsletter
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Get weekly updates, sermon notes, and church announcements
              delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                name="email"
                className="form-input flex-grow p-2 rounded-lg border-focus:ring-2 border-focus:ring-[#FF7E45]"
                placeholder="Your email address"
                required
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
              />
              <button
                type="submit"
                className="btn btn-primary whitespace-nowrap hover:bg-[#FFA76A] hover:text-white p-2 rounded-lg"
              >
                Subscribe <i className="fas fa-paper-plane ml-2"></i>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Edit/Create Post Modal */}
      {(showEditModal || showCreateModal) && (
        <BlogPostModal
          post={currentPost}
          onSave={handleSavePost}
          onClose={() => {
            setShowEditModal(false);
            setShowCreateModal(false);
            setCurrentPost(null);
          }}
          isEdit={showEditModal}
          tagInput={tagInput}
          setTagInput={setTagInput}
        />
      )}
    </div>
  );
};

// Blog Post Modal Component
const BlogPostModal = ({ post, onSave, onClose, isEdit, tagInput, setTagInput }) => {
  const [formData, setFormData] = useState(post || {
    title: '',
    excerpt: '',
    content: '',
    category: 'announcements',
    imageUrl: '',
    author: '',
    tags: []
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.excerpt.trim()) newErrors.excerpt = 'Excerpt is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (!formData.imageUrl.trim()) newErrors.imageUrl = 'Image URL is required';
    if (!formData.author.trim()) newErrors.author = 'Author is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  useEffect(() => {
    if (post) {
      setFormData(post);
    }
  }, [post]);

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {isEdit ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                >
                  <option value="announcements">Announcements</option>
                  <option value="events">Events</option>
                  <option value="community">Community</option>
                  <option value="missions">Missions</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Excerpt *</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="6"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Image URL *</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-[#FF7E45] text-white px-4 rounded-lg hover:bg-[#FFA76A]"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#FF7E45] text-white rounded-lg hover:bg-[#FFA76A] transition-colors"
              >
                {isEdit ? 'Update' : 'Create'} Post
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;