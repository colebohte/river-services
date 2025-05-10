(function(Scratch) {
  'use strict';

  // Replace with your Supabase project URL and anon key
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
              supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
              isSupabaseInitialized = true;
              console.log("Supabase client initialized.");

              // Listen for auth state changes (optional but good practice)
              supabase.auth.onAuthStateChange((event, session) => {
                console.log("Supabase auth state change:", event, session);
                if (event === 'SIGNED_IN' && session) {
                    handleLoginSuccess(session.user);
                } else if (event === 'SIGNED_OUT') {
                    handleLogout();
                }
              });

              // Check initial session status on load
              checkSession();

          } catch (e) {
              console.error("Error initializing Supabase client:", e);
              // Handle initialization error, maybe set an internal status
          }
      }
  }

  // Check for an existing session
  async function checkSession() {
      if (!supabase) {
          console.error("Supabase client not initialized when checking session.");
          return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (error) {
          console.error("Error checking session:", error);
          handleLogout(); // Assume logged out on error
      } else if (data.session) {
          handleLoginSuccess(data.session.user);
      } else {
          handleLogout(); // No session found
      }
  }


  // Handle successful login (called internally or by message listener)
  function handleLoginSuccess(user) {
      console.log("Handling login success for user:", user);
      currentUser = user;
      isLoggedIn = true;
      // Trigger Scratch event/update if possible (depends on Scratch 3.0 extension API details)
      // For now, state is updated, reporters will reflect it.
  }

  // Handle logout
  function handleLogout() {
      console.log("Handling logout.");
      currentUser = null;
      isLoggedIn = false;
  }


  // Listen for messages from the login window
  window.addEventListener('message', (event) => {
      // IMPORTANT: Verify the origin of the message in production!
      // if (event.origin !== 'https://yourusername.github.io') {
      //     console.warn('Received message from unknown origin:', event.origin);
      //     return;
      // }

      const data = event.data;
      if (data && data.type === 'supabaseAuthResult') {
          console.log("Received auth result message:", data);
          if (data.success) {
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
      initializeSupabase();

      return {
        id: 'twSupabaseAuth',
        name: 'Supabase Auth',
        blocks: [
          {
            opcode: 'loginWithGoogle',
            blockType: Scratch.BlockType.COMMAND,
            text: 'log in with Google',
          },
           {
            opcode: 'logout',
            blockType: Scratch.BlockType.COMMAND,
            text: 'log out',
          },
          '---', // Separator
          {
            opcode: 'isLoggedIn',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is logged in?',
          },
          {
            opcode: 'isEmailVerified',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is email verified?',
          },
          {
            opcode: 'getUserId',
            blockType: Scratch.BlockType.REPORTER,
            text: 'user ID',
          },
          {
            opcode: 'getUserEmail',
            blockType: Scratch.BlockType.REPORTER,
            text: 'user email',
          },
           {
            opcode: 'getUserFullName',
            blockType: Scratch.BlockType.REPORTER,
            text: 'user full name',
          },
          {
            opcode: 'getUserShortName',
            blockType: Scratch.BlockType.REPORTER,
            text: 'user short name', // Assuming first name
          },
           {
            opcode: 'getUserPfpUrl',
            blockType: Scratch.BlockType.REPORTER,
            text: 'user profile picture URL (256px)',
          },
          // Add other reporters here as needed
        ],
        // Optional: Add categories, colors, etc.
        // category: 'data', // Example category
        // color1: '#0079f2', // Example color
      };
    }

    // Command block to initiate login
    loginWithGoogle() {
        // Replace with the URL where your login.html is hosted on GitHub Pages
        const loginPageUrl = 'https://yourusername.github.io/your-repo/login.html';
        // Open login.html in a new window
        window.open(loginPageUrl, '_blank', 'width=600,height=700');
         // Note: The extension itself doesn't handle the redirect; login.html does.
         // We just open the window and wait for a postMessage.
    }

    // Command block to initiate logout
    async logout() {
        if (!supabase) {
             console.error("Supabase client not initialized for logout.");
             return;
        }
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error during logout:", error);
        } else {
            console.log("User signed out.");
            handleLogout(); // Update internal state
        }
    }


    // Reporter blocks

    isLoggedIn() {
      return isLoggedIn;
    }

    isEmailVerified() {
        // Supabase user object from OAuth should have email_verified in user_metadata
        // Or sometimes directly on the user object depending on provider and Supabase version
        return currentUser ? (currentUser.email_verified || currentUser.user_metadata.email_verified || false) : false;
    }

    getUserId() {
      return currentUser ? currentUser.id : '';
    }

    getUserEmail() {
      return currentUser ? currentUser.email : '';
    }

    getUserFullName() {
       // Assuming Google provides full_name in user_metadata
      return currentUser ? (currentUser.user_metadata.full_name || '') : '';
    }

     getUserShortName() {
        // Assuming short name is the first name from full_name
        const fullName = this.getUserFullName(); // Use the existing reporter logic
        if (fullName) {
            return fullName.split(' ')[0] || '';
        }
        return '';
    }


    getUserPfpUrl() {
        // Assuming Google provides avatar_url in user_metadata
        const avatarUrl = currentUser ? (currentUser.user_metadata.avatar_url || '') : '';
        if (avatarUrl) {
            // Attempt to change Google's size parameter from s96-c (common) to s256-c
            try {
                const url = new URL(avatarUrl);
                 // Check if it's a googleusercontent.com URL which often uses this parameter
                if (url.hostname.includes('googleusercontent.com')) {
                    const sizeParam = url.searchParams.get('s');
                    if (sizeParam) {
                        url.searchParams.set('s', '256'); // Change size to 256
                        // Keep the -c if it was present
                         if (sizeParam.includes('-c')) {
                              url.searchParams.set('c', ''); // Add 'c' param if needed
                         }
                        return url.toString();
                    }
                     // If no 's' parameter, just return the original URL
                     return avatarUrl;
                } else {
                     // Not a recognized Google URL format, return original
                    return avatarUrl;
                }
            } catch (e) {
                console.error("Error processing avatar URL:", e);
                return avatarUrl; // Return original on error
            }
        }
        return '';
    }


    // Add other block implementations here
  }

   // Check if Scratch is defined before registering
    if (typeof Scratch !== 'undefined') {
        Scratch.extensions.register(new SupabaseAuthExtension());
    } else {
        console.error("Scratch environment not found. Could not register extension.");
    }

})(Scratch);
