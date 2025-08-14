const API_BASE = "http://localhost:5000/api"; // Change if needed

// SIGNUP
async function signup() {
  const username = document.getElementById("signup-username").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  const res = await fetch(`${API_BASE}/user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();
  console.log(data);
  alert("Signup response: " + JSON.stringify(data));
}

// LOGIN
async function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const res = await fetch(`${API_BASE}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  console.log(data);
  
  if (data.token) {
    localStorage.setItem("token", data.token);
    alert("Login successful");
  } else {
    alert("Login failed");
  }
}

// CREATE POST
async function createPost() {
  const title = document.getElementById("post-title").value;
  const content = document.getElementById("post-content").value;
  const isPublic = document.getElementById("post-isPublic").checked;

  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/user/post`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, content, isPublic })
  });

  const data = await res.json();
  console.log(data);
  alert("Post created: " + JSON.stringify(data));
}

// FETCH POSTS
async function getPosts() {
  const res = await fetch(`${API_BASE}/subscription/content`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const posts = await res.json();
  console.log(posts);

  const container = document.getElementById("posts-container");
  container.innerHTML = "";

  posts.forEach(p => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `<h3>${p.title}</h3><p>${p.content}</p>`;
    container.appendChild(div);
  });
}

// SUBSCRIBE
async function subscribe() {
  const creatorId = document.getElementById("creator-id").value;
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/subscription/subscribe/${creatorId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  console.log(data);
  alert("Subscribed: " + JSON.stringify(data));
}
