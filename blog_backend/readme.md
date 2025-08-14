# Blog Backend with Subscription Model

A Node.js/Express backend for a blog application with a subscription model where everyone can be both a creator and subscriber.

## Features

### Core Functionality
- **User Authentication**: Signup, login with JWT tokens
- **User Management**: Profile editing, user roles (user/admin)
- **Blog Posts**: Create, read, update, delete posts
- **Comments & Likes**: Interact with posts
- **Follow System**: Follow/unfollow other users

### Subscription Model
- **Everyone is a Creator**: All users can create content
- **Everyone is a Subscriber**: All users can subscribe to others
- **Content Types**: 
  - `public`: Visible to everyone
  - `subscriber`: Only visible to subscribers
  - `admin`: Admin-created content visible to all
- **Free Subscriptions**: No payment required

## Database Schema

### Users
```javascript
{
  username: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  role: String (user/admin),
  bio: String,
  // Subscription fields
  subscriptions: [ObjectId], // Users they subscribe to
  subscribers: [ObjectId],   // Users who subscribe to them
  creatorBio: String,        // Creator description
  creatorCategory: String,   // Content category
  isVerifiedCreator: Boolean // Admin verified
}
```

### Blogs
```javascript
{
  title: String,
  content: String,
  author: ObjectId (ref: Users),
  tags: [String],
  comments: [{
    user: ObjectId,
    comment: String,
    timestamp: Date
  }],
  likes: [ObjectId],
  isPublished: Boolean,
  // Subscription fields
  isSubscriberOnly: Boolean, // Only for subscribers
  isAdminContent: Boolean,   // Created by admin
  contentType: String        // "public", "subscriber", "admin"
}
```

### Subscriptions
```javascript
{
  subscriber: ObjectId (ref: Users),
  creator: ObjectId (ref: Users),
  startDate: Date,
  isActive: Boolean
}
```

## API Endpoints

### Authentication
- `POST /api/user/signup` - Register new user
- `POST /api/user/login` - Login user
- `GET /api/user/profile/:id` - Get user profile
- `PUT /api/user/edit/:id` - Edit user profile

### Blog Posts
- `POST /api/user/post` - Create a blog post
- `POST /api/user/comment/:postId` - Comment on a post
- `POST /api/user/like/:postId` - Like a post
- `DELETE /api/user/comment/:postId/:commentId` - Delete comment

### Subscriptions
- `GET /api/subscription/creators` - Get all creators
- `POST /api/subscription/subscribe/:creatorId` - Subscribe to a creator
- `DELETE /api/subscription/unsubscribe/:creatorId` - Unsubscribe from creator
- `GET /api/subscription/my-subscriptions` - Get user's subscriptions
- `GET /api/subscription/content` - Get subscription content feed
- `PUT /api/subscription/update-creator-profile` - Update creator profile
- `GET /api/subscription/creator/:creatorId/content` - Get creator's content

### Admin Routes
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/ban` - Ban a user
- `PUT /api/admin/users/:id/unban` - Unban a user
- `DELETE /api/admin/posts/:id` - Delete a post
- `GET /api/admin/dashboard` - Admin dashboard stats
- `POST /api/admin/create-content` - Create admin content
- `PUT /api/admin/verify-creator/:userId` - Verify a creator
- `GET /api/admin/creators` - Get all creators for admin

## Content Visibility Rules

### What Users See:
1. **Admin Content**: All admin-created content (visible to everyone)
2. **Public Content**: All public posts from any user
3. **Subscriber Content**: Only from creators they subscribe to

### Creating Content:
- **Public Posts**: Anyone can create
- **Subscriber-Only Posts**: Anyone can create (no restrictions)
- **Admin Content**: Only admins can create

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ADMIN_KEY=your_admin_key_for_creating_admins
   PORT=3000
   ```

3. **Start Server**
   ```bash
   npm start
   ```

## Usage Examples

### Create a Subscriber-Only Post
```javascript
POST /api/user/post
{
  "title": "Exclusive Content",
  "content": "This is only for my subscribers!",
  "tags": ["exclusive", "premium"],
  "contentType": "subscriber",
  "isSubscriberOnly": true
}
```

### Subscribe to a Creator
```javascript
POST /api/subscription/subscribe/creator_user_id
```

### Get Subscription Feed
```javascript
GET /api/subscription/content?page=1&limit=10
```

### Update Creator Profile
```javascript
PUT /api/subscription/update-creator-profile
{
  "creatorBio": "I write about technology and lifestyle",
  "creatorCategory": "tech"
}
```

## Key Features

- **Free Subscription Model**: No payment processing required
- **Flexible Content Types**: Public, subscriber-only, and admin content
- **Creator Verification**: Admins can verify creators
- **Content Filtering**: Users only see content they have access to
- **Pagination**: Efficient content loading with pagination
- **Real-time Updates**: Subscription relationships update immediately

This model allows for a community-driven platform where everyone can both create and consume content based on their interests and relationships. 