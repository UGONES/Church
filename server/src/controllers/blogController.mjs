import BlogPost from '../models/BlogPost.mjs';
import Favorite from '../models/Favorite.mjs';

// Get all blog posts
export async function getAllBlogPosts(req, res) {
  try {
    const { page = 1, limit = 10, category, status = 'published' } = req.query;
    
    const query = { status };
    if (category) query.category = category;

    const blogPosts = await BlogPost.find(query)
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BlogPost.countDocuments(query);

    res.json({
      blogPosts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get blog categories
export async function getBlogCategories(req, res) {
  try {
    const categories = await BlogPost.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get favorite blog posts
export async function getFavoriteBlogPosts(req, res) {
  try {
    const favorites = await Favorite.find({
      userId: req.user._id,
      itemType: 'blog'
    }).populate('itemId');

    res.json(favorites.map(fav => fav.itemId));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Add favorite blog post
export async function addFavoriteBlogPost(req, res) {
  try {
    const { id } = req.params;

    const existingFavorite = await Favorite.findOne({
      userId: req.user._id,
      itemType: 'blog',
      itemId: id
    });

    if (existingFavorite) {
      return res.status(400).json({ message: 'Blog post already in favorites' });
    }

    const favorite = new Favorite({
      userId: req.user._id,
      itemType: 'blog',
      itemId: id
    });

    await favorite.save();
    res.status(201).json({ message: 'Blog post added to favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Remove favorite blog post
export async function removeFavoriteBlogPost(req, res) {
  try {
    const { id } = req.params;

    await Favorite.findOneAndDelete({
      userId: req.user._id,
      itemType: 'blog',
      itemId: id
    });

    res.json({ message: 'Blog post removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Subscribe to newsletter
export async function subscribeToNewsletter(req, res) {
  try {
    const { email } = req.body;

    // In a real application, you would add this email to your newsletter service
    res.json({ message: 'Successfully subscribed to newsletter' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get all blog posts (Admin)
export async function getAllBlogPostsAdmin(req, res) {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const blogPosts = await BlogPost.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BlogPost.countDocuments(query);

    res.json({
      blogPosts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Create blog post (Admin)
export async function createBlogPost(req, res) {
  try {
    const blogData = req.body;
    
    if (req.file) {
      blogData.imageUrl = req.file.path;
    }

    blogData.author = req.user._id;

    const blogPost = new BlogPost(blogData);
    await blogPost.save();
    await blogPost.populate('author', 'name email');

    res.status(201).json({
      message: 'Blog post created successfully',
      blogPost
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Update blog post (Admin)
export async function updateBlogPost(req, res) {
  try {
    const { id } = req.params;
    const blogData = req.body;

    if (req.file) {
      blogData.imageUrl = req.file.path;
    }

    const blogPost = await BlogPost.findByIdAndUpdate(id, blogData, {
      new: true,
      runValidators: true
    }).populate('author', 'name email');

    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json({
      message: 'Blog post updated successfully',
      blogPost
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Delete blog post (Admin)
export async function deleteBlogPost(req, res) {
  try {
    const { id } = req.params;

    const blogPost = await BlogPost.findByIdAndDelete(id);
    
    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    await Favorite.deleteMany({ itemType: 'blog', itemId: id });

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get blog categories (Admin)
export async function getBlogCategoriesAdmin(req, res) {
  try {
    const categories = await BlogPost.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
