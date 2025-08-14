# ChatGPT Prompt: Subscription-Based Blog Application

## Project Overview
Create a complete subscription-based blog application with Node.js/Express backend and React frontend. The app allows users to create content, subscribe to other creators, and view content based on subscription status.

## Backend Requirements

### Technology Stack
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcrypt for password hashing
- CORS enabled

### Database Schema

#### User Schema
```javascript
{
  username: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  avatar: String (default: ""),
  role: String (default: "user"),
  since: Date (default: Date.now),
  lastLogin: Date (default: Date.now),
  isActive: Boolean (default: true),
  bio: String (default: ""),
  bookmarks: [ObjectId ref Blogs],
  following: [ObjectId ref Users],
  followers: [ObjectId ref Users],
  posts: [ObjectId ref Blogs],
  // Subscription fields
  subscriptions: [ObjectId ref Users],
  subscribers: [ObjectId ref Users],
  creatorBio: String (default: ""),
  creatorCategory: String (default: ""),
  isVerifiedCreator: Boolean (default: false)
}
```

#### Blog Schema
```javascript
{
  title: String (required),
  content: String (required),
  author: ObjectId ref Users,
  tags: [String],
  comments: [{
    user: ObjectId ref Users,
    comment: String,
    timestamp: Date (default: Date.now)
  }],
  likes: [ObjectId ref Users],
  isPublished: Boolean (default: false),
  isPublic: Boolean (default: true) // true = public, false = subscribers only
}
```

#### Subscription Schema
```javascript
{
  subscriber: ObjectId ref Users (required),
  creator: ObjectId ref Users (required),
  startDate: Date (default: Date.now),
  isActive: Boolean (default: true)
}
```

### API Endpoints

#### Authentication Routes (`/api/user`)
- `POST /signup` - Register new user
- `POST /login` - User login (returns JWT token)
- `GET /profile/:id` - Get user profile
- `PUT /edit/:id` - Edit user profile (authenticated)
- `POST /post` - Create blog post (authenticated)
- `POST /comment/:postId` - Add comment to post (authenticated)
- `POST /like/:postId` - Like a post (authenticated)
- `DELETE /comment/:postId/:commentId` - Delete comment (authenticated owner)
- `POST /follow/:targetUserId` - Follow user (authenticated)
- `POST /unfollow/:targetUserId` - Unfollow user (authenticated)

#### Subscription Routes (`/api/subscription`)
- `GET /creators` - Get all creators (public info)
- `POST /subscribe/:creatorId` - Subscribe to creator (authenticated)
- `DELETE /unsubscribe/:creatorId` - Unsubscribe from creator (authenticated)
- `GET /my-subscriptions` - Get user's subscriptions (authenticated)
- `GET /content` - Get subscription content feed (authenticated, paginated)
- `PUT /update-creator-profile` - Update creator profile (authenticated)
- `GET /creator/:creatorId/content` - Get creator's content (authenticated)

#### Admin Routes (`/api/admin`)
- `GET /dashboard` - Admin dashboard stats
- `POST /create-content` - Create admin content (admin only)
- `PUT /verify-creator/:userId` - Verify creator (admin only)
- `GET /creators` - Get all creators (admin only)

### Key Features
1. **Simple Content Visibility**: Posts have `isPublic` boolean - true for public, false for subscribers only
2. **Free Subscriptions**: No payment system, just free subscriptions
3. **Everyone is a Creator**: All users can create content and have subscribers
4. **Content Access Control**: Users only see subscriber-only content from creators they're subscribed to
5. **JWT Authentication**: Secure token-based authentication
6. **Role-based Access**: Admin and user roles with different permissions

## Frontend Requirements

### Technology Stack
- React 18 with functional components and hooks
- React Router for navigation
- Axios for API calls
- React Hot Toast for notifications
- React Icons for icons
- Moment.js for date formatting
- CSS for styling (no external UI libraries)

### Key Components

#### Core Components
- `App.js` - Main application with routing
- `Navbar.js` - Navigation with user menu
- `Loading.js` - Loading spinner
- `PostCard.js` - Reusable post display component

#### Pages
- `Home.js` - Main feed showing public + subscribed content
- `Login.js` - User login form
- `Signup.js` - User registration form
- `CreatePost.js` - Create new blog post with public/subscriber toggle
- `Creators.js` - Browse and subscribe to creators
- `CreatorProfile.js` - View specific creator's content
- `Profile.js` - User profile management
- `SubscriptionFeed.js` - Content from subscribed creators only
- `AdminDashboard.js` - Admin-only dashboard

### Key Features
1. **Responsive Design**: Mobile-friendly layout
2. **Real-time Updates**: Refresh data after actions
3. **User-friendly Forms**: Proper validation and error handling
4. **Content Visibility Indicators**: Show lock/unlock icons for post visibility
5. **Subscription Management**: Easy subscribe/unsubscribe buttons
6. **Clean UI**: Modern, clean design with good UX

### API Integration
- Use axios with interceptors for JWT token management
- Handle loading states and error messages
- Implement proper error handling with toast notifications
- Use localStorage for token persistence

### Styling Requirements
- Clean, modern design
- Responsive grid layouts
- Hover effects and transitions
- Consistent color scheme (blue primary color)
- Card-based layouts for posts and creators
- Proper spacing and typography

## Implementation Guidelines

### Backend
1. Set up Express server with middleware (CORS, JSON parsing, etc.)
2. Connect to MongoDB using Mongoose
3. Implement JWT authentication middleware
4. Create all required routes with proper error handling
5. Add input validation and sanitization
6. Implement proper HTTP status codes and error messages

### Frontend
1. Set up React app with routing
2. Implement authentication context for global state
3. Create reusable components
4. Add proper loading states and error handling
5. Implement responsive design
6. Add toast notifications for user feedback

### Security Considerations
- Hash passwords with bcrypt
- Validate and sanitize all inputs
- Use JWT tokens with expiration
- Implement proper CORS settings
- Add rate limiting for API endpoints
- Validate user permissions for protected routes

### Performance Considerations
- Implement pagination for content feeds
- Use proper database indexing
- Optimize database queries with population
- Implement proper error boundaries in React
- Use React.memo for performance optimization where needed

## Expected Output
Provide complete, working code for:
1. Backend server with all API endpoints
2. React frontend with all components and pages
3. Database schemas and models
4. Proper error handling and validation
5. Clean, responsive UI design
6. Complete setup instructions

The application should be ready to run with minimal setup - just install dependencies and start the servers.
