import BlogPost from "../models/BlogPost.mjs";
import Favorite from "../models/Favorite.mjs";

/**
 * 🧠 Helper – Uniform success response
 */
const sendSuccess = (res, data, message = "Success", status = 200) => {
  return res.status(status).json({ success: true, message, data });
};

/**
 * 🧠 Helper – Uniform error response
 */
const sendError = (res, error, message = "Server error", status = 500) => {
  console.error("❌ Blog Controller Error:", error);
  return res.status(status).json({ success: false, message, error: error?.message || message, });
};

/* ============================================================================
   📜 PUBLIC ROUTES
============================================================================ */

/**
 * GET /api/blogs/posts
 * Fetch all published blog posts
 */
export async function getAllBlogPosts(req, res) {
  try {
    const { page = 1, limit = 10, category, status = "published" } = req.query;

    const query = { status };
    if (category) query.category = category;

    const blogPosts = await BlogPost.find(query)
      .populate("author", "name avatar")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * Number(limit));

    const total = await BlogPost.countDocuments(query);

    return sendSuccess(res, {
      posts: blogPosts,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * GET /api/blogs/categories
 * Fetch all unique categories
 */
export async function getBlogCategories(req, res) {
  try {
    const categories = await BlogPost.distinct("category");
    return sendSuccess(res, categories);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * GET /api/blogs/favorites
 * Get user’s favorite blog posts
 */
export async function getFavoriteBlogPosts(req, res) {
  try {
    const favorites = await Favorite.find({
      userId: req.user._id,
      itemType: "blog",
    }).populate("itemId");

    const favPosts = favorites.map((fav) => fav.itemId);
    return sendSuccess(res, favPosts);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * POST /api/blogs/favorites/:id
 * Add a blog post to favorites
 */
export async function addFavoriteBlogPost(req, res) {
  try {
    const { id } = req.params;

    const existingFavorite = await Favorite.findOne({
      userId: req.user._id,
      itemType: "blog",
      itemId: id,
    });

    if (existingFavorite) {
      return sendError(res, null, "Blog post already in favorites", 400);
    }

    const favorite = new Favorite({
      userId: req.user._id,
      itemType: "blog",
      itemId: id,
    });

    await favorite.save();
    return sendSuccess(res, favorite, "Blog post added to favorites", 201);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * DELETE /api/blogs/favorites/:id
 * Remove a blog post from favorites
 */
export async function removeFavoriteBlogPost(req, res) {
  try {
    const { id } = req.params;

    await Favorite.findOneAndDelete({
      userId: req.user._id,
      itemType: "blog",
      itemId: id,
    });

    return sendSuccess(res, null, "Blog post removed from favorites");
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * POST /api/blogs/subscribe
 * Subscribe to newsletter
 */
export async function subscribeToNewsletter(req, res) {
  try {
    const { email } = req.body;
    if (!email)
      return sendError(res, null, "Email is required", 400);

    // Placeholder — integrate Mailchimp or SendGrid here
    console.log("📬 Newsletter subscriber:", email);

    return sendSuccess(res, { email }, "Successfully subscribed to newsletter!");
  } catch (error) {
    return sendError(res, error);
  }
}

/* ============================================================================
   🛠️ ADMIN & MODERATOR ROUTES
============================================================================ */

/**
 * GET /api/blogs/admin
 * Fetch all blog posts (admin & moderator)
 */
export async function getAllBlogPostsAdmin(req, res) {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const blogPosts = await BlogPost.find(query)
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * Number(limit));

    const total = await BlogPost.countDocuments(query);

    return sendSuccess(res, {
      posts: blogPosts,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * POST /api/blogs/admin/create
 * Create new blog post (admin or moderator)
 */
export async function createBlogPost(req, res) {
  try {
    const user = req.user;

    if (!["admin", "moderator"].includes(user.role)) {
      return sendError(res, null, "Unauthorized access", 403);
    }

    const blogData = req.body;
    blogData.author = user._id;

    if (req.file) {
      blogData.imageUrl = req.file.path;
    }

    const blogPost = await BlogPost.create(blogData);
    await blogPost.populate("author", "name email");

    return sendSuccess(res, blogPost, "Blog post created successfully", 201);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * PUT /api/blogs/admin/:id
 * Update blog post (admin or moderator)
 */
export async function updateBlogPost(req, res) {
  try {
    const user = req.user;

    if (!["admin", "moderator"].includes(user.role)) {
      return sendError(res, null, "Unauthorized access", 403);
    }

    const { id } = req.params;
    const blogData = req.body;

    if (req.file) {
      blogData.imageUrl = req.file.path;
    }

    const blogPost = await BlogPost.findByIdAndUpdate(id, blogData, {
      new: true,
      runValidators: true,
    }).populate("author", "name email");

    if (!blogPost) {
      return sendError(res, null, "Blog post not found", 404);
    }

    return sendSuccess(res, blogPost, "Blog post updated successfully");
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * DELETE /api/blogs/admin/:id
 * Delete blog post (admin or moderator)
 */
export async function deleteBlogPost(req, res) {
  try {
    const user = req.user;

    if (!["admin", "moderator"].includes(user.role)) {
      return sendError(res, null, "Unauthorized access", 403);
    }

    const { id } = req.params;

    const blogPost = await BlogPost.findByIdAndDelete(id);
    if (!blogPost) {
      return sendError(res, null, "Blog post not found", 404);
    }

    await Favorite.deleteMany({ itemType: "blog", itemId: id });
    return sendSuccess(res, null, "Blog post deleted successfully");
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * GET /api/blogs/admin/categories
 * Get category list with post count (admin/moderator)
 */
export async function getBlogCategoriesAdmin(req, res) {
  try {
    const categories = await BlogPost.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return sendSuccess(res, categories);
  } catch (error) {
    return sendError(res, error);
  }
}
