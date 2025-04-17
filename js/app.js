// Spotify API Configuration
const CLIENT_ID = "f9938a519d6440a6a9764868b76f8e6e"; // Replace with your Spotify Client ID
const REDIRECT_URI = window.location.origin + window.location.pathname;
const SCOPES = "playlist-read-private playlist-read-collaborative";

// Spotify API URLs
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const API_ENDPOINT = "https://api.spotify.com/v1";

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
  console.log("Access token:", token ? "Found" : "Not found");

  if (!token) {
    throw new Error("No access token available");
  }

  console.log(`Calling Spotify API: ${endpoint}`);

  try {
    const response = await fetch(`${API_ENDPOINT}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Handle token expiration
    if (response.status === 401) {
      console.error("Token expired or invalid");
      localStorage.removeItem("spotify_access_token");
      showLoginScreen();
      throw new Error("Token expired. Please log in again.");
    }

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("API response:", data);
    return data;
  } catch (error) {
    console.error("API call error:", error);
    throw error;
  }
}

// Start the app
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize DOM elements after the document is fully loaded
  const loginButton = document.getElementById("login-button");
  const loginContainer = document.getElementById("login-container");
  const playlistContainer = document.getElementById("playlist-container");
  const playlistsEl = document.getElementById("playlists");
  const userProfileEl = document.getElementById("user-profile");
  const displayNameEl = document.getElementById("display-name");

  console.log("DOM elements initialized:", {
    loginButton: !!loginButton,
    loginContainer: !!loginContainer,
    playlistContainer: !!playlistContainer,
    playlistsEl: !!playlistsEl,
    userProfileEl: !!userProfileEl,
    displayNameEl: !!displayNameEl,
  });

  // Event Listeners
  if (loginButton) {
    loginButton.addEventListener("click", () => {
      // Create and redirect to Spotify authorization URL using Implicit Grant Flow
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        response_type: "token",
        show_dialog: "true",
      });

      const authUrl = `${AUTH_ENDPOINT}?${params.toString()}`;
      console.log("Authorization URL:", authUrl);
      window.location.href = authUrl;
    });
  }

  // Show login screen (hide other content)
  function showLoginScreen() {
    if (loginContainer) loginContainer.classList.remove("hidden");
    if (playlistContainer) playlistContainer.classList.add("hidden");
    if (userProfileEl) userProfileEl.classList.add("hidden");
  }

  // Show main content (hide login)
  function showMainContent() {
    if (loginContainer) loginContainer.classList.add("hidden");
  }

  // Get user profile and display name
  async function getUserProfile() {
    try {
      const profile = await callSpotifyApi("/me");
      console.log("User profile:", profile);
      if (displayNameEl && profile.display_name) {
        displayNameEl.textContent = profile.display_name;
        console.log("Username set to:", profile.display_name);
      }
      if (userProfileEl) userProfileEl.classList.remove("hidden");
      return profile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }

  // Get and display user's playlists
  async function fetchAndDisplayPlaylists() {
    try {
      const data = await callSpotifyApi("/me/playlists?limit=50");

      if (playlistsEl) {
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

        if (playlistContainer) playlistContainer.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Error displaying playlists:", error);
    }
  }

  // Initialize the application
  async function initApp() {
    console.log("App initializing...");

    const isLoggedIn = checkUrlForToken();
    console.log("User logged in:", isLoggedIn);

    if (isLoggedIn) {
      showMainContent();
      await getUserProfile();
      await fetchAndDisplayPlaylists();
    } else {
      showLoginScreen();
    }
  }

  // Start the initialization
  initApp();
});
