(function(Scratch) {
  'use strict';

  // !!! IMPORTANT: Replace with your actual Supabase project URL and anon key !!!
  const SUPABASE_URL = 'https://gxqbrcutslyybxexvszr.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWJyY3V0c2x5eWJ4ZXh2c3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTMxODYsImV4cCI6MjA2MjMyOTE4Nn0.yBF90TTgVBVihO5rH0HpK4DvKFfy4fGm3ps05vKeDjU';

  // Supabase client instance (initialized later)
  let supabase = null;

  // Internal state to store user data
  let currentUser = null;
  let isLoggedIn = false;

  // Flag to ensure Supabase client is initialized only once
  let isSupabaseInitialized = false;

  // Function to initialize Supabase client
  function initializeSupabase() {
      if (!isSupabaseInitialized) {
          try {
              // Ensure Scratch.fetch is available if needed for network requests,
              // but Supabase client usually uses standard browser fetch.
              // If running in a highly restricted Scratch env, this might need adjustment.
              supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
              isSupabaseInitialized = true;
              console.log("Supabase client initialized.");

              // Listen for auth state changes (optional but good practice)
              // This helps keep the extension state in sync if auth changes outside the login window
              const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
                console.log("Supabase auth state change:", event, session);
                if (event === 'SIGNED_IN' && session && session.user) {
                    // Use the user object from the session
                    handleLoginSuccess(session.user);
                } else if (event === 'SIGNED_OUT') {
                    handleLogout();
                }
              });
              // Store listener if needed for cleanup, though browser extensions often persist

              // Check initial session status on load
              checkSession();

          } catch (e) {
              console.error("Error initializing Supabase client:", e);
              // Handle initialization error, maybe set an internal status
              isSupabaseInitialized = false; // Reset if init failed
          }
      }
  }

  // Check for an existing session when the extension loads
  async function checkSession() {
      if (!supabase) {
          console.error("Supabase client not initialized when checking session.");
          return;
      }
      try {
           const { data, error } = await supabase.auth.getSession();
           if (error) {
               console.error("Error checking session:", error);
               handleLogout(); // Assume logged out on error
           } else if (data.session && data.session.user) {
               handleLoginSuccess(data.session.user); // Session found
           } else {
               handleLogout(); // No session found
           }
      } catch (e) {
          console.error("Exception checking session:", e);
          handleLogout();
      }
  }


  // Handle successful login (called internally or by message listener)
  function handleLoginSuccess(user) {
      console.log("Handling login success for user:", user);
      currentUser = user;
      isLoggedIn = true;
      // You could potentially emit a custom event here if the Scratch API supported it
      // to notify blocks that the user state has changed, but reporters polling is standard.
  }

  // Handle logout
  function handleLogout() {
      console.log("Handling logout.");
      currentUser = null;
      isLoggedIn = false;
  }


  // Listen for messages from the login window (login.html)
  window.addEventListener('message', (event) => {
      // !!! IMPORTANT: Verify the origin of the message in production! !!!
      // Replace 'https://colebohte.github.io' with the exact origin of your hosted login.html
      // In development '*' might be used, but it's insecure for production.
       if (event.origin !== 'https://colebohte.github.io') {
           console.warn('Received message from unknown origin:', event.origin);
           return; // Ignore messages from unexpected origins
       }

      const data = event.data;
      if (data && data.type === 'supabaseAuthResult') {
          console.log("Received auth result message:", data);
          if (data.success && data.user) {
              // The message contains the user data directly
              handleLoginSuccess(data.user);
          } else {
              console.error("Auth flow reported failure:", data.error);
              handleLogout(); // Ensure state is logged out on failure
          }
      }
  });


  class SupabaseAuthExtension {
    getInfo() {
      // Initialize Supabase client when Scratch requests extension info
      // This ensures the client is ready before blocks are used.
      initializeSupabase();

      return {
        id: 'twSupabaseAuth', // Unique ID for your extension
        name: 'Supabase Auth', // Display name in Scratch
        blocks: [
          {
            opcode: 'loginWithGoogle',
            blockType: Scratch.BlockType.COMMAND,
            text: 'log in with Google',
            tooltip: 'Opens a window to log in with Google via Supabase.',
          },
           {
            opcode: 'logout',
            blockType: Scratch.BlockType.COMMAND,
            text: 'log out',
             tooltip: 'Logs out the current user from Supabase.',
          },
          '---', // Separator
          {
            opcode: 'isLoggedIn',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is logged in?',
             tooltip: 'Reports true if a user is currently logged in.',
          },
          {
            opcode: 'isEmailVerified',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is email verified?',
            tooltip: 'Reports true if the logged-in user\'s email is verified.',
          },
          {
            opcode: 'getUserId',
            blockType: Scratch.BlockType.REPORTER,
            text: 'user ID',
            tooltip: 'Reports the unique ID of the logged-in user.',
          },
          {
            opcode: 'getUserEmail',
            blockType: Scratch.BlockType.REPORTER,
            text: 'user email',
             tooltip: 'Reports the email address of the logged-in user.',
          },
           {
            opcode: 'getUserFullName',
            blockType: Scratch.BlockType.REPORTER,
            text: 'user full name',
             tooltip: 'Reports the full name of the logged-in user (from provider metadata).',
          },
          {
            opcode: 'getUserShortName',
            blockType: Scratch.BlockType.REPORTER,
            text: 'user short name', // Assuming first name
             tooltip: 'Reports the first name of the logged-in user.',
          },
           {
            opcode: 'getUserPfpUrl',
            blockType: Scratch.BlockType.REPORTER,
            text: 'user profile picture URL (256px)',
            tooltip: 'Reports the profile picture URL of the logged-in user, attempting 256px size.',
          },
          // Add other reporter or command blocks here based on your needs
        ],
        // Optional: Add categories, colors, etc. for better presentation in Scratch
        category: 'sensing', // Example category: put under Sensing blocks
        color1: '#0079f2', // Example color
        color2: '#0066cc', // Example shadow color
      };
    }

    // Command block implementation for login
    loginWithGoogle() {
        // !!! IMPORTANT: Replace with the exact URL where your login.html is hosted on GitHub Pages !!!
        const loginPageUrl = 'https://colebohte.github.io/river-services/login.html';
        console.log("Opening login window:", loginPageUrl);
        // Open login.html in a new window. Give it a name (like '_blank') so it opens a new tab each time
        // or a specific name if you want to reuse the same window. '_blank' is simpler.
        window.open(loginPageUrl, '_blank', 'width=600,height=700');
         // The actual authentication flow and handling the redirect happens in login.html.
         // We just opened the window and the extension will listen for a postMessage back.
    }

    // Command block implementation for logout
    async logout() {
        if (!supabase) {
             console.error("Supabase client not initialized for logout.");
             // Optionally update state even if client not ready, assuming logout failed or was already out.
             handleLogout();
             return;
        }
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error during logout:", error);
                 // Depending on error, might still consider state logged out
                 handleLogout(); // Optimistically update state
            } else {
                console.log("User signed out successfully.");
                handleLogout(); // Update internal state on success
            }
        } catch (e) {
             console.error("Exception during logout:", e);
             handleLogout(); // Update state on exception
        }
    }


    // Reporter block implementations

    isLoggedIn() {
      // Reporters should be simple and return the current state.
      return isLoggedIn;
    }

    isEmailVerified() {
        // Check if currentUser and the verified status exist
        // Google OAuth usually provides 'email_verified' on the user object itself
        // Supabase might also put it in user_metadata depending on the provider/version
        return currentUser ? (currentUser.email_verified === true) : false; // Explicitly check for true
    }

    getUserId() {
      return currentUser ? currentUser.id : '';
    }

    getUserEmail() {
      return currentUser ? currentUser.email : '';
    }

    getUserFullName() {
       // Assuming Google provides full_name in user_metadata from the OAuth scope
      return currentUser && currentUser.user_metadata ? (currentUser.user_metadata.full_name || '') : '';
    }

     getUserShortName() {
        // Assuming short name is the first name from full_name
        const fullName = this.getUserFullName(); // Use the existing reporter logic
        if (fullName) {
            // Split by space and take the first part
            const parts = fullName.split(' ');
            return parts[0] || '';
        }
        return '';
    }


    getUserPfpUrl() {
        // Assuming Google provides avatar_url in user_metadata
        const avatarUrl = currentUser && currentUser.user_metadata ? (currentUser.user_metadata.avatar_url || '') : '';
        if (avatarUrl) {
            // Attempt to modify Google's size parameter (e.g., from s96-c to s256-c)
            try {
                const url = new URL(avatarUrl);
                 // Check if the hostname looks like a Google user content domain
                if (url.hostname.includes('googleusercontent.com') || url.hostname.includes('ggpht.com')) {
                    // Get all search parameters
                    const params = url.searchParams;
                    // Google photo URLs often use 's' for size
                    const sizeParam = params.get('s');

                    if (sizeParam) {
                        // Replace the size value
                        params.set('s', '256');
                        // Rebuild the URL with the modified parameters
                        url.search = params.toString();
                        return url.toString();
                    }
                     // If no 's' parameter is found, return the original URL
                     return avatarUrl;
                } else {
                     // Not a recognized Google URL format, return original
                    return avatarUrl;
                }
            } catch (e) {
                console.error("Error processing avatar URL:", e);
                // Return original URL or empty string on error
                return avatarUrl;
            }
        }
        return ''; // Return empty string if no avatar URL is available
    }


    // Add implementations for other blocks here if you add any

  }

   // Register the extension with Scratch once it's loaded
    if (typeof Scratch !== 'undefined') {
        Scratch.extensions.register(new SupabaseAuthExtension());
        console.log("Supabase Auth Extension registered.");
    } else {
        console.error("Scratch environment (Scratch or TurboWarp) not found. Could not register extension.");
    }

})(Scratch);
