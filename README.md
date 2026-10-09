# ConnectHub — Mini Social Media Platform

**CodeAlpha Internship Task 2**  
*A complete full-stack social networking application built with Node.js, Express, MongoDB, and Vanilla JavaScript.*

---

## 📖 Project Overview

**ConnectHub** is a responsive, feature-rich social media platform designed and engineered from scratch without frontend frameworks. The platform enables creators and professionals to publish posts, share imagery, engage through real-time likes and threaded comments, build reciprocal follow networks, explore community content, and curate personal user profiles.

---

## 🚀 Key Features

1. **User Authentication & Security**
   - User registration with real-time input validation (password matching, email formatting, username constraints).
   - Password hashing with **bcryptjs** (10 salt rounds).
   - Stateless **JSON Web Token (JWT)** authentication with Bearer token headers.
   - Protected routes and authorization middleware ensuring users can only modify their own data.
   - Built-in **Demo Account Auto-Fill** on the login screen.

2. **Personalized Feed & Explore Stream**
   - **Personalized Feed:** Chronological stream combining posts from the logged-in user and creators they follow.
   - **Explore Feed:** Switchable tab allowing discovery of posts across the entire community.
   - Interactive quick post composer right on the feed page.

3. **Post Publishing & Management**
   - Create posts with long-form text (up to 2,000 characters) and optional high-resolution image URLs.
   - Dedicated post creation page with live image preview and character counter.
   - **Edit Posts:** Edit content and image of existing posts with an inline modal.
   - **Delete Posts:** Delete own posts with confirmation modal and cascade deletion of related comments.

4. **Interactive Engagement (Likes & Comments)**
   - **Like / Unlike System:** Toggle post likes with heart animations and instant counter updates. Duplicate likes are prevented at the database level.
   - **Threaded Comments:** Expandable comment panel for each post.
   - Post comments instantly and delete own comments with authorization verification.

5. **Follow & Social Graph**
   - Reciprocal Follow/Unfollow system (users cannot follow themselves).
   - Real-time followers and following count tracking.
   - Dedicated **Following** & **Followers** pages with one-click follow toggles.

6. **User Search & Discovery**
   - Live search bar with debouncing filtering users by full name or `@username`.
   - Dedicated "Explore People" directory with follow shortcuts and profile links.
   - "Suggested Creators" sidebar widget on the main feed.

7. **User Profile Pages**
   - Customizable profile cards with banner, avatar, full name, username, and bio.
   - Dynamic profile routing (`/profile.html?id=...` or defaults to own profile).
   - Live profile editor modal for name, username, bio, and avatar updates.
   - Filtered stream of all posts published by that specific user.

8. **Design Aesthetics & Responsiveness**
   - Tailored modern dark theme with Indigo/Violet gradient accents and frosted glassmorphism.
   - Built using **HTML5, CSS3, and Vanilla JavaScript** — strictly no frontend frameworks.
   - Custom floating toast notification system.
   - Fully responsive desktop (3-column), tablet (2-column), and mobile (single-column with bottom navigation bar) layouts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3 (Custom Variables, Flexbox, Grid), Vanilla JavaScript (ES6+) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Styling & Fonts** | Plus Jakarta Sans (Google Fonts), SVG Micro-Icons |

---

## 📂 Project Structure

```text
CodeAlpha_Social_Media_Platform/
├── package.json              # Project metadata & npm dependencies
├── server.js                 # Express server & MongoDB connection
├── .env                      # Environment variables (PORT, MONGODB_URI, JWT_SECRET)
├── .gitignore                # Git ignore rules
├── README.md                 # Project documentation
│
├── models/                   # Mongoose Schemas & Data Models
│   ├── User.js               # User accounts, bios, followers & following
│   ├── Post.js               # Posts, content, image URL, likes array
│   └── Comment.js            # Comments tied to posts & users
│
├── middleware/               # Express Middlewares
│   └── authMiddleware.js     # JWT Bearer token protection & optionalProtect
│
├── controllers/              # Application Business Logic
│   ├── authController.js     # Register, login, getMe
│   ├── userController.js     # User profile, search, follow, unfollow
│   ├── postController.js     # Feed, user posts, CRUD, like/unlike
│   └── commentController.js  # Add, view, delete comments
│
├── routes/                   # REST API Route Declarations
│   ├── authRoutes.js         # /api/auth endpoints
│   ├── userRoutes.js         # /api/users endpoints
│   ├── postRoutes.js         # /api/posts endpoints
│   └── commentRoutes.js      # /api/comments endpoints
│
├── public/                   # Static Frontend Client
│   ├── index.html            # Main Feed & Dashboard
│   ├── login.html            # User Login with Demo Auto-Fill
│   ├── register.html         # User Registration
│   ├── profile.html          # Profile view & Bio Editor
│   ├── create-post.html      # Dedicated Post Composer
│   ├── users.html            # Member Search & Directory
│   ├── following.html        # Network Lists (Following & Followers)
│   │
│   ├── css/
│   │   └── style.css         # Modern design system & responsive styling
│   │
│   ├── js/
│   │   ├── main.js           # API fetch wrapper, toasts, navbar, auth state
│   │   ├── auth.js           # Login & registration forms
│   │   ├── feed.js           # Feed rendering, likes, comments, post modals
│   │   ├── profile.js        # Profile loading & updating
│   │   ├── post.js           # Post creator with live image preview
│   │   └── users.js          # Search debouncing & following lists
│   │
│   └── images/               # Image assets directory
│
├── seed/
│   └── seedData.js           # Database seeder with 6 users & 11 posts
│
└── test/
    └── testApp.js            # Automated 25-point integration test suite
```

---

## 🗄️ Database Schema Design

### 1. User Model (`models/User.js`)
- `name`: String (required, max 50 chars)
- `username`: String (required, unique, lowercase, alphanumeric + `_`)
- `email`: String (required, unique, validated format)
- `password`: String (required, bcrypt hashed)
- `bio`: String (max 200 chars)
- `profileImage`: String (avatar URL)
- `followers`: Array of `ObjectId` referencing `User`
- `following`: Array of `ObjectId` referencing `User`
- `createdAt`, `updatedAt`: Timestamps

### 2. Post Model (`models/Post.js`)
- `user`: `ObjectId` referencing `User` (required)
- `content`: String (required, max 2000 chars)
- `image`: String (optional image URL)
- `likes`: Array of `ObjectId` referencing `User`
- `createdAt`, `updatedAt`: Timestamps

### 3. Comment Model (`models/Comment.js`)
- `post`: `ObjectId` referencing `Post` (required)
- `user`: `ObjectId` referencing `User` (required)
- `text`: String (required, max 500 chars)
- `createdAt`: Date

---

## ⚙️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local Community Server running on `127.0.0.1:27017` or a MongoDB Atlas URI)

### 1. Clone & Enter Project Directory
```bash
git clone <repository-url>
cd CodeAlpha_Social_Media_Platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/connecthub
JWT_SECRET=supersecretjwtkey_connecthub_codealpha_2026_secure
```

### 4. Seed the Database with Realistic Sample Data
Run the built-in database seeder to populate sample users, posts, comments, likes, and social relationships:
```bash
npm run seed
```

### 5. Start the Server
For production mode:
```bash
npm start
```

For development mode (with auto-reload):
```bash
npm run dev
```

### 6. Access the Application
Open your browser and navigate to:
```text
http://localhost:5000
```

---

## 👤 Demo Account Credentials

Use the pre-configured demo account to explore ConnectHub immediately:

- **Email:** `demo@connecthub.com`
- **Password:** `Demo123`

*(You can also click the **Auto-Fill** button on the login screen to fill these credentials in one click).*

Additional sample accounts created by the seeder (Password: `Password123`):
- `sarah@connecthub.com` (`@sarah_c`)
- `alex@connecthub.com` (`@alex_dev`)
- `priya@connecthub.com` (`@priya_designs`)
- `marcus@connecthub.com` (`@marcus_v`)
- `elena@connecthub.com` (`@elena_code`)

---

## 📡 REST API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user details | Yes |

### Users
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users` | List suggested platform users | Optional |
| `GET` | `/api/users/search?q=keyword` | Search users by name or username | Optional |
| `GET` | `/api/users/:id` | Fetch specific user profile & metrics | Optional |
| `PUT` | `/api/users/:id` | Update own user profile | Yes |
| `GET` | `/api/users/:id/followers` | Get followers of a user | Optional |
| `GET` | `/api/users/:id/following` | Get accounts followed by a user | Optional |
| `POST` | `/api/users/:id/follow` | Follow a user | Yes |
| `DELETE` | `/api/users/:id/follow` | Unfollow a user | Yes |

### Posts
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/posts/feed` | Get personalized feed (own + following) | Optional |
| `GET` | `/api/posts/feed?explore=true` | Get community-wide feed | Optional |
| `GET` | `/api/posts/user/:userId` | Get posts created by a specific user | Optional |
| `GET` | `/api/posts/:id` | Fetch single post details | Optional |
| `POST` | `/api/posts` | Create a new post | Yes |
| `PUT` | `/api/posts/:id` | Edit an existing post (author only) | Yes |
| `DELETE` | `/api/posts/:id` | Delete a post & its comments (author only) | Yes |
| `POST` | `/api/posts/:id/like` | Like a post | Yes |
| `DELETE` | `/api/posts/:id/like` | Unlike a post | Yes |

### Comments
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/posts/:id/comments` | Get all comments for a post | Optional |
| `POST` | `/api/posts/:id/comments` | Add comment to a post | Yes |
| `DELETE` | `/api/comments/:id` | Delete own comment | Yes |

---

## 🧪 Automated Testing

A dedicated test suite is included in `test/testApp.js`. Run the tests while the server is running:

```bash
node test/testApp.js
```

### Verified Scenarios (25/25 Passing):
- [x] Server startup & MongoDB connectivity
- [x] User registration with validation
- [x] Duplicate registration rejection (duplicate email and username)
- [x] User login & JWT token generation
- [x] Protected endpoint token verification (`/api/auth/me`)
- [x] User profile retrieval and bio editing
- [x] Post creation with content and image
- [x] Post editing by author
- [x] Post deletion by author
- [x] Like post and unlike post with duplicate prevention
- [x] Threaded comments creation and deletion
- [x] User search by name and handle
- [x] Reciprocal follow and unfollow logic
- [x] Followers and Following lists integrity
- [x] Personalized feed generation
- [x] Unauthorized access rejection (401)
- [x] Invalid requests rejection (400)
- [x] Static HTML client file delivery

---

## 📸 Screenshots & UI Previews

- **Feed View:** 3-column layout featuring user profile card, post composer, personalized feed stream, and suggested creators sidebar.
- **Interactions:** Dynamic heart like animations, instant comment threads, and profile follow state toggles.
- **Search Page:** Real-time debounced discovery interface displaying matching creators with direct follow controls.
- **Profile View:** Hero cover banner, avatar overlay, engagement counters, and user-published post history.

---

## 🔮 Future Enhancements

- Image upload via Multer and cloud storage (AWS S3 or Cloudinary).
- Real-time instant messaging using WebSockets (`Socket.IO`).
- Notification bell system for likes, comments, and new followers.
- Hashtags (`#topic`) and post bookmarking.
