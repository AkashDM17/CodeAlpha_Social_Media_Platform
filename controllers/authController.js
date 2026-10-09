const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecretjwtkey_connecthub_default',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, username, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, username, email, password).'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirm password do not match.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username) || username.length < 3 || username.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters and contain only letters, numbers, and underscores.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: username.toLowerCase().trim() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase().trim()) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }
      if (existingUser.username === username.toLowerCase().trim()) {
        return res.status(400).json({
          success: false,
          message: 'This username is already taken. Please choose another.'
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Default avatar
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username.trim())}`;

    // Create user
    const user = await User.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      profileImage: defaultAvatar,
      bio: `Hello! I'm ${name.trim()} on ConnectHub.`
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          bio: user.bio,
          profileImage: user.profileImage,
          followersCount: user.followers.length,
          followingCount: user.following.length,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.'
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { identifier, email, username, password } = req.body;
    const loginIdentifier = (identifier || email || username || '').toLowerCase().trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or username and password.'
      });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier },
        { username: loginIdentifier }
      ]
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    const token = generateToken(user._id);

    // Count posts
    const postsCount = await Post.countDocuments({ user: user._id });

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          bio: user.bio,
          profileImage: user.profileImage,
          followersCount: user.followers.length,
          followingCount: user.following.length,
          postsCount,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.'
    });
  }
};

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const postsCount = await Post.countDocuments({ user: user._id });

    return res.status(200).json({
      success: true,
      message: 'Current user profile retrieved successfully.',
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        followers: user.followers,
        following: user.following,
        postsCount,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving current user.'
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};
