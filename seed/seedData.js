const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/connecthub';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing collections
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    console.log('Existing data cleared.');

    // Password hashes
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('Demo123', salt);
    const genericPasswordHash = await bcrypt.hash('Password123', salt);

    // Create 6 realistic users
    console.log('Creating sample users...');
    const usersData = [
      {
        name: 'Demo User',
        username: 'demouser',
        email: 'demo@connecthub.com',
        password: demoPasswordHash,
        bio: 'Exploring ConnectHub! Tech enthusiast, photographer, and coffee lover ☕',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Sarah Connor',
        username: 'sarah_c',
        email: 'sarah@connecthub.com',
        password: genericPasswordHash,
        bio: 'AI researcher & open-source contributor. Building intelligent tools for tomorrow 🤖',
        profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Alex Rivera',
        username: 'alex_dev',
        email: 'alex@connecthub.com',
        password: genericPasswordHash,
        bio: 'Full-stack software engineer. Coffee in, robust code out. JavaScript & Node.js nerd 🚀',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Priya Sharma',
        username: 'priya_designs',
        email: 'priya@connecthub.com',
        password: genericPasswordHash,
        bio: 'UI/UX Designer creating digital experiences that spark joy. Minimalism & clean typography ✨',
        profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Marcus Vance',
        username: 'marcus_v',
        email: 'marcus@connecthub.com',
        password: genericPasswordHash,
        bio: 'Cloud architect & amateur landscape photographer. Hiking peaks on weekends 🏔️',
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Elena Rostova',
        username: 'elena_code',
        email: 'elena@connecthub.com',
        password: genericPasswordHash,
        bio: 'Creative web developer experimenting with canvas, micro-interactions, and animations 🎨',
        profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'
      }
    ];

    const users = await User.insertMany(usersData);
    const [demoUser, sarah, alex, priya, marcus, elena] = users;

    console.log('Establishing follow relationships...');
    // Demo user follows Sarah, Alex, and Priya
    demoUser.following = [sarah._id, alex._id, priya._id];
    demoUser.followers = [sarah._id, elena._id];

    // Sarah follows Demo user and Alex
    sarah.following = [demoUser._id, alex._id];
    sarah.followers = [demoUser._id, priya._id, elena._id];

    // Alex follows Priya, Marcus, and Sarah
    alex.following = [priya._id, marcus._id, sarah._id];
    alex.followers = [demoUser._id, sarah._id, marcus._id, elena._id];

    // Priya follows Alex and Demo user
    priya.following = [alex._id, demoUser._id];
    priya.followers = [demoUser._id, alex._id];

    // Marcus follows Alex and Elena
    marcus.following = [alex._id, elena._id];
    marcus.followers = [alex._id];

    // Elena follows Demo user, Sarah, and Alex
    elena.following = [demoUser._id, sarah._id, alex._id];
    elena.followers = [demoUser._id, marcus._id];

    await Promise.all([
      demoUser.save(),
      sarah.save(),
      alex.save(),
      priya.save(),
      marcus.save(),
      elena.save()
    ]);

    console.log('Creating sample posts...');
    const postsData = [
      {
        user: demoUser._id,
        content: 'Welcome to ConnectHub! Excited to share my journey, connect with wonderful engineers, and discuss modern web design ideas.',
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
        likes: [sarah._id, alex._id, priya._id]
      },
      {
        user: sarah._id,
        content: 'Just deployed our new neural retrieval benchmark! The latency dropped by 42% after migrating our vector indexing pipeline. Hard work really pays off! 🚀💻',
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        likes: [demoUser._id, alex._id]
      },
      {
        user: alex._id,
        content: 'Pro tip for JavaScript developers: Keep your controllers thin and business logic modular. Clean code will always save your future self countless debugging hours.',
        image: '',
        likes: [demoUser._id, sarah._id, priya._id, marcus._id]
      },
      {
        user: priya._id,
        content: 'Crafted a fresh dark-mode UI design system today. Focused on accessible contrast ratios, fluid typography, and subtle glowing glass cards. What do you all think? 🎨',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
        likes: [demoUser._id, alex._id, elena._id]
      },
      {
        user: marcus._id,
        content: 'Sunrise hike at Rocky Ridge Summit this morning. Nothing clears the mind like fresh mountain air before diving back into architecture blueprints. 🏔️🌤️',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
        likes: [alex._id, elena._id]
      },
      {
        user: elena._id,
        content: 'Micro-interactions make all the difference! Added smooth ripple effects and state badges to our dashboard buttons. Small details turn good software into delightful experiences.',
        image: '',
        likes: [demoUser._id, priya._id]
      },
      {
        user: demoUser._id,
        content: 'Coffee + Code = The ultimate weekend productivity setup. Working on a new full-stack project today! ☕⌨️',
        image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
        likes: [sarah._id, alex._id]
      },
      {
        user: sarah._id,
        content: 'Reading "Designing Data-Intensive Applications" again. Every time I revisit this book, I discover new insights about distributed consensus and replication.',
        image: '',
        likes: [alex._id, marcus._id]
      },
      {
        user: alex._id,
        content: 'Weekend coding marathon complete! Nothing beats that feeling when all automated test suites turn green at once. ✨✅',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        likes: [demoUser._id, sarah._id]
      },
      {
        user: priya._id,
        content: 'Remember: Design is not just what it looks like and feels like. Design is how it works. Happy creating everyone!',
        image: '',
        likes: [demoUser._id, alex._id, marcus._id, elena._id]
      },
      {
        user: marcus._id,
        content: 'Cloud cost optimization milestone achieved: Reduced idle container instances by 35% through event-driven scaling triggers.',
        image: '',
        likes: [alex._id]
      }
    ];

    const posts = await Post.insertMany(postsData);
    console.log(`Created ${posts.length} sample posts.`);

    console.log('Adding realistic comments...');
    const commentsData = [
      {
        post: posts[0]._id,
        user: sarah._id,
        text: 'Welcome to ConnectHub! Thrilled to have you in the community!'
      },
      {
        post: posts[0]._id,
        user: alex._id,
        text: 'Great to connect with you! Looking forward to your posts.'
      },
      {
        post: posts[1]._id,
        user: demoUser._id,
        text: '42% drop is huge! Which indexing algorithm did you end up using?'
      },
      {
        post: posts[1]._id,
        user: sarah._id,
        text: 'We settled on HNSW with quantized vectors. Worked like a charm!'
      },
      {
        post: posts[2]._id,
        user: demoUser._id,
        text: 'Totally agree Alex! Modular code pays dividends in the long run.'
      },
      {
        post: posts[2]._id,
        user: priya._id,
        text: 'Solid advice. Clear code saves lives during production deployments!'
      },
      {
        post: posts[3]._id,
        user: alex._id,
        text: 'The glassmorphism card looks incredible Priya! Love the color harmony.'
      },
      {
        post: posts[3]._id,
        user: demoUser._id,
        text: 'Very sleek UI! Are you using HSL color variables?'
      },
      {
        post: posts[4]._id,
        user: elena._id,
        text: 'Breathtaking photo Marcus! Those mountain peaks look majestic.'
      },
      {
        post: posts[6]._id,
        user: sarah._id,
        text: 'Nothing beats a good pour-over coffee while coding!'
      }
    ];

    const comments = await Comment.insertMany(commentsData);
    console.log(`Created ${comments.length} comments.`);

    console.log('\n===============================================');
    console.log('🎉 Database Seeding Completed Successfully!');
    console.log('===============================================');
    console.log('Demo Account Credentials:');
    console.log('  Email:    demo@connecthub.com');
    console.log('  Password: Demo123');
    console.log('-----------------------------------------------');
    console.log('Sample Users:');
    users.forEach((u) => {
      console.log(`  - ${u.name} (@${u.username}) [${u.email}]`);
    });
    console.log('===============================================\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
