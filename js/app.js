// Spotify API Configuration
const CLIENT_ID = "f9938a519d6440a6a9764868b76f8e6e"; // Replace with your Spotify Client ID
const REDIRECT_URI = window.location.origin + window.location.pathname;
const SCOPES = "playlist-read-private playlist-read-collaborative";

// Spotify API URLs
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const API_ENDPOINT = "https://api.spotify.com/v1";

// DOM Elements
const loginButton = document.getElementById("login-button");
const loginContainer = document.getElementById("login-container");
const playlistContainer = document.getElementById("playlist-container");
const playlistsEl = document.getElementById("playlists");
const userProfileEl = document.getElementById("user-profile");
const displayNameEl = document.getElementById("display-name");

// Event Listeners
loginButton.addEventListener("click", () => {
  // Create and redirect to Spotify authorization URL
  const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(SCOPES)}&response_type=token&show_dialog=true`;
  window.location.href = authUrl;
});

// Check if user just logged in (has token in URL hash)
function checkUrlForToken() {
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");

    if (accessToken) {
      // Save token and remove hash from URL
      localStorage.setItem("spotify_access_token", accessToken);
      window.location.hash = "";
      return true;
    }
  }

  // Check if token exists in localStorage
  return !!localStorage.getItem("spotify_access_token");
}

// Helper function to make authenticated API requests
async function callSpotifyApi(endpoint) {
  const token = localStorage.getItem("spotify_access_token");

  if (!token) {
    throw new Error("No access token available");
  }

  const response = await fetch(`${API_ENDPOINT}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Handle token expiration
  if (response.status === 401) {
    localStorage.removeItem("spotify_access_token");
    showLoginScreen();
    throw new Error("Token expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

// Get user profile and display name
async function getUserProfile() {
  try {
    const profile = await callSpotifyApi("/me");
    displayNameEl.textContent = profile.display_name;
    userProfileEl.classList.remove("hidden");
    return profile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
}

// Get and display user's playlists
async function fetchAndDisplayPlaylists() {
  try {
    const data = await callSpotifyApi("/me/playlists?limit=50");

    playlistsEl.innerHTML = "";

    data.items.forEach((playlist) => {
      const coverImg =
        playlist.images.length > 0
          ? playlist.images[0].url
          : "https://developer.spotify.com/assets/branding-guidelines/icon3@2x.png";

      const playlistEl = document.createElement("div");
      playlistEl.className = "playlist-item";
      playlistEl.innerHTML = `
                <img class="playlist-cover" src="${coverImg}" alt="${playlist.name}">
                <div class="playlist-name">${playlist.name}</div>
                <div class="playlist-tracks">${playlist.tracks.total} tracks</div>
            `;

      playlistsEl.appendChild(playlistEl);
    });

    playlistContainer.classList.remove("hidden");
  } catch (error) {
    console.error("Error displaying playlists:", error);
  }
}

// Show login screen (hide other content)
function showLoginScreen() {
  loginContainer.classList.remove("hidden");
  playlistContainer.classList.add("hidden");
  userProfileEl.classList.add("hidden");
}

// Show main content (hide login)
function showMainContent() {
  loginContainer.classList.add("hidden");
}

// Initialize the application
async function initApp() {
  const isLoggedIn = checkUrlForToken();

  if (isLoggedIn) {
    showMainContent();
    await getUserProfile();
    await fetchAndDisplayPlaylists();
  } else {
    showLoginScreen();
  }
}

// Start the app
document.addEventListener("DOMContentLoaded", initApp);
