# BlogOnSpot - The AI-Powered Blogging Platform

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

Welcome to **BlogOnSpot**, a modern, feature-rich blogging platform designed for creators and readers. This platform integrates a subscription model, role-based access, and cutting-edge AI features to deliver a superior content experience.



---

## ✨ Key Features

BlogOnSpot is packed with features that empower both creators and consumers:

*   **🤖 AI-Powered Tools**:
    *   **On-Demand Summarization**: Generate a concise summary of any post with a single click.
    *   **Hover-to-Summarize**: Get a quick, AI-generated summary just by hovering over a post card, allowing for rapid content discovery.
    *   **Plagiarism Checker**: Ensure content originality with an integrated plagiarism check before publishing.

*   **🔒 Advanced Content Gating**:
    *   **Public vs. Subscriber-Only**: Creators can mark their posts as `public` (visible to all) or `subscriber-only`.
    *   **Subscription Model**: Users can subscribe to their favorite creators for free to access exclusive content.
    *   **Smart Access Control**: The UI dynamically adjusts, showing locked content previews and a "Subscribe to View" call-to-action for non-subscribers.

*   **🛡️ Admin & Role-Based Controls**:
    *   **Authentication-Aware Navbar**: The navigation bar changes based on whether a user is logged in, showing either sign-in/sign-up prompts or a user profile menu.
    *   **Powerful Admin Dashboard**: Admins can manage the platform, view all content, and access user management tools.
    *   **User Management**: Admins have the ability to disable or re-enable user accounts to maintain community standards.

*   **💅 Modern, Animated Interface**:
    *   Built with **Framer Motion** for smooth, delightful animations on modals, dropdowns, and page transitions.
    *   **Onboarding Tour**: A beautiful, multi-step onboarding modal guides new users through the platform's main features.
    *   **Dynamic Avatars**: Uniquely generated SVG avatars for users based on their category and username.

*   **Rich User Interactions**:
    *   **Like & Bookmark**: Users can like and save posts for later. The UI provides instant feedback.
    *   **Commenting System**: Engage with creators and other readers through a built-in commenting system on each post.

*   **🎨 Theming**:
    *   Switch between **Light and Dark** modes with a single click. The user's preference is saved locally for a consistent experience.

---

## 🛠️ Tech Stack

This project is a full-stack MERN application.

### Frontend (`blog_frontend`)
*   **Framework**: React
*   **Routing**: React Router DOM
*   **Styling**: Inline styles, CSS variables for theming
*   **Animation**: Framer Motion
*   **API Communication**: Axios
*   **Notifications**: React Hot Toast
*   **Icons**: React Icons

### Backend (`blog_backend`)
*   **Framework**: Node.js with Express
*   **Database**: MongoDB with Mongoose
*   **Authentication**: JSON Web Tokens (JWT)

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v14 or later)
*   npm or yarn
*   MongoDB (local instance or a cloud service like MongoDB Atlas)

### Backend Setup

1.  **Navigate to the backend directory:**
    ```sh
    cd blog_backend
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Create a `.env` file** in the `blog_backend` root and add the following environment variables:
    ```env
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=a_strong_secret_for_jwt
    ADMIN_KEY=a_secret_key_to_create_the_first_admin
    PORT=3001
    ```

4.  **Start the backend server:**
    ```sh
    npm start
    ```
    The backend will be running on `http://localhost:3001`.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```sh
    cd blog_frontend
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Start the frontend development server:**
    ```sh
    npm start
    ```
    The application will open automatically in your browser at `http://localhost:3000`.

---

## 📂 Project Structure

The repository is organized into two main folders: `blog_frontend` and `blog_backend`.

```
blog/
├── blog_frontend/       # React Frontend Application
│   ├── public/
│   └── src/
│       ├── api/         # Axios instance and API call functions
│       ├── components/  # Reusable components (Navbar, PostCard, Modal, etc.)
│       ├── context/     # AuthContext for global state management
│       ├── pages/       # Page components (Home, Login, Profile, etc.)
│       └── App.jsx      # Main application component with routing
│
└── blog_backend/        # Node.js/Express Backend
    ├── controllers/     # Logic for handling requests
    ├── models/          # Mongoose schemas for the database
    ├── routes/          # API endpoint definitions
    └── server.js        # Main server entry point
```

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
