const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

// Helper to format post with isLiked, likesCount, commentsCount, isOwner
const formatPost = async (post, currentUserId) => {
  const commentsCount = await Comment.countDocuments({ post: post._id });
  const isLiked = currentUserId
    ? post.likes.some((id) => id.toString() === currentUserId.toString())
    : false;
  const isOwner = currentUserId && post.user
    ? (post.user._id ? post.user._id.toString() : post.user.toString()) === currentUserId.toString()
    : false;

  return {
    _id: post._id,
    content: post.content,
    image: post.image,
    likesCount: post.likes.length,
    likes: post.likes,
    isLiked,
    isOwner,
    commentsCount,
    user: post.user,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt
  };
};

// @desc    Get personalized feed (own posts + followed users' posts)
// @route   GET /api/posts/feed
// @access  Private (or Public with explore fallback)
const getFeed = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user._id : null;
    const { explore } = req.query;

    let filter = {};

    if (explore === 'true' || !currentUserId) {
      // Explore mode: all posts
      filter = {};
    } else {
      // Personalized feed: current user + following
      const currentUser = await User.findById(currentUserId);
      const feedUserIds = [currentUser._id, ...(currentUser.following || [])];
      filter = { user: { $in: feedUserIds } };
    }

    const posts = await Post.find(filter)
      .populate('user', 'name username profileImage bio')
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedPosts = await Promise.all(
      posts.map((post) => formatPost(post, currentUserId))
    );

    return res.status(200).json({
      success: true,
      message: 'Feed retrieved successfully',
      data: formattedPosts
    });
  } catch (error) {
    console.error('Get feed error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving feed'
    });
  }
};

// @desc    Get posts by a specific user
// @route   GET /api/posts/user/:userId
// @access  Public / Private
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user ? req.user._id : null;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const posts = await Post.find({ user: userId })
      .populate('user', 'name username profileImage bio')
      .sort({ createdAt: -1 });

    const formattedPosts = await Promise.all(
      posts.map((post) => formatPost(post, currentUserId))
    );

    return res.status(200).json({
      success: true,
      message: 'User posts retrieved successfully',
      data: formattedPosts
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user posts'
    });
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public / Private
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user ? req.user._id : null;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    const post = await Post.findById(id).populate('user', 'name username profileImage bio');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const formattedPost = await formatPost(post, currentUserId);

    return res.status(200).json({
      success: true,
      message: 'Post retrieved successfully',
      data: formattedPost
    });
  } catch (error) {
    console.error('Get post by id error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving post'
    });
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot be empty'
      });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot exceed 2000 characters'
      });
    }

    const newPost = await Post.create({
      user: req.user._id,
      content: content.trim(),
      image: image ? image.trim() : ''
    });

    const populatedPost = await Post.findById(newPost._id).populate(
      'user',
      'name username profileImage bio'
    );

    const formattedPost = await formatPost(populatedPost, req.user._id);

    return res.status(201).json({
      success: true,
      message: 'Post created successfully!',
      data: formattedPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating post'
    });
  }
};

// @desc    Update/edit own post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, image } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Authorization check
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own posts'
      });
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Post content cannot be empty'
        });
      }
      post.content = content.trim();
    }

    if (image !== undefined) {
      post.image = image.trim();
    }

    await post.save();

    const populatedPost = await Post.findById(post._id).populate(
      'user',
      'name username profileImage bio'
    );

    const formattedPost = await formatPost(populatedPost, req.user._id);

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: formattedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating post'
    });
  }
};

// @desc    Delete own post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Authorization check
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own posts'
      });
    }

    // Delete associated comments
    await Comment.deleteMany({ post: post._id });

    // Delete post
    await Post.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Post and associated comments deleted successfully',
      data: { postId: id }
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting post'
    });
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already liked
    const alreadyLiked = post.likes.some(
      (likeId) => likeId.toString() === currentUserId.toString()
    );

    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: 'You have already liked this post',
        data: {
          likesCount: post.likes.length,
          isLiked: true
        }
      });
    }

    post.likes.push(currentUserId);
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post liked',
      data: {
        postId: post._id,
        likesCount: post.likes.length,
        isLiked: true
      }
    });
  } catch (error) {
    console.error('Like post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error liking post'
    });
  }
};

// @desc    Unlike a post
// @route   DELETE /api/posts/:id/like
// @access  Private
const unlikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if liked
    const isLiked = post.likes.some(
      (likeId) => likeId.toString() === currentUserId.toString()
    );

    if (!isLiked) {
      return res.status(400).json({
        success: false,
        message: 'You have not liked this post yet',
        data: {
          likesCount: post.likes.length,
          isLiked: false
        }
      });
    }

    post.likes = post.likes.filter(
      (likeId) => likeId.toString() !== currentUserId.toString()
    );
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post unliked',
      data: {
        postId: post._id,
        likesCount: post.likes.length,
        isLiked: false
      }
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error unliking post'
    });
  }
};

module.exports = {
  getFeed,
  getUserPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost
};
