(function(Scratch) {
  'use strict';

  // !!! IMPORTANT: Replace with your actual Supabase project URL and anon key !!!
  const SUPABASE_URL = 'https://gxqbrcutslyybxexvszr.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWJyY3V0c2x5eWJ4ZXh2c3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTMxODYsImV4cCI6MjA2MjMyOTE4Nn0.yBF90TTgVBVihO5rH0HpK4DvKFfy4fGm3ps05vKeDjU';

  // Supabase client instance (initialized later)
  let supabase = null;

  // Internal state to store user data received from Supabase
  let currentUser = null;
  let isLoggedIn = false; // Track if the user is currently authenticated

  // Flag to ensure Supabase client is initialized only once
  let isSupabaseInitialized = false;

  // Reference to the login window opened by the extension
  let authWindow = null;

  // Function to initialize Supabase client
  function initializeSupabase() {
      if (!isSupabaseInitialized) {
          try {
              supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
              isSupabaseInitialized = true;
              console.log("Supabase client initialized.");

              // Listen for auth state changes (helpful for keeping state in sync)
              // Although the postMessage is the primary way data is sent back from login.html,
              // this listener helps if the user logs out elsewhere or the session expires.
               supabase.auth.onAuthStateChange((event, session) => {
                console.log("Supabase auth state change:", event, session);
                if (event === 'SIGNED_IN' && session && session.user) {
                     // Note: The user object here might have slightly different metadata initially
                     // compared to the one sent via postMessage from login.html,
                     // but it's sufficient to update the isLoggedIn status.
                     // The postMessage will provide the detailed metadata needed for reporters.
                     // We can potentially call handleLoginSuccess here too if the session user
                     // has enough data, but relying on the postMessage for full data is safer.
                    if (!isLoggedIn || (currentUser && currentUser.id !== session.user.id)) {
                         console.log("Auth state change: SIGNED_IN. Checking session data.");
                         checkSession(); // Re-check session to get latest user data
                    }
                } else if (event === 'SIGNED_OUT') {
                    console.log("Auth state change: SIGNED_OUT.");
                    handleLogout();
                } else if (event === 'INITIAL_SESSION' && session && session.user) {
                     console.log("Auth state change: INITIAL_SESSION.");
                     handleLoginSuccess(session.user); // Handle existing session on load
                } else if (event === 'INITIAL_SESSION' && !session) {
                    console.log("Auth state change: INITIAL_SESSION (no session).");
                    handleLogout(); // Ensure state is logged out if no initial session
                }
              });


              // Check for an existing session immediately on load
              checkSession();

          } catch (e) {
              console.error("Error initializing Supabase client:", e);
              isSupabaseInitialized = false; // Reset if init failed
              // Optionally set isLoggedIn to false and clear currentUser if initialization fails
              handleLogout();
          }
      }
  }

   // Check for an existing session and update state
    async function checkSession() {
        if (!supabase || !isSupabaseInitialized) {
            console.error("Supabase client not initialized when checking session.");
            return;
        }
        try {
             const { data, error } = await supabase.auth.getSession();
             if (error) {
                 console.error("Error checking session:", error);
                 handleLogout(); // Assume logged out on error
             } else if (data.session && data.session.user) {
                 // If session found, get the user data and update state
                 console.log("Session found on check:", data.session.user);
                 handleLoginSuccess(data.session.user);
             } else {
                 // No session found
                 console.log("No session found on check.");
                 handleLogout();
             }
        } catch (e) {
            console.error("Exception checking session:", e);
            handleLogout();
        }
    }


  // Handle successful login (called by message listener or session check)
  function handleLoginSuccess(user) {
      console.log("Handling login success for user:", user);
      currentUser = user;
      isLoggedIn = true;
      // The reporters will now use this stored 'currentUser' object
  }

  // Handle logout or no session
  function handleLogout() {
      console.log("Handling logout / no session.");
      currentUser = null;
      isLoggedIn = false;
  }


  // Listen for messages from the login window (login.html)
  window.addEventListener('message', (event) => {
      // !!! IMPORTANT: Verify the origin of the message in production! !!!
      // Use the exact origin of your hosted login.html on GitHub Pages.
      const expectedOrigin = 'https://colebohte.github.io';
       if (event.origin !== expectedOrigin) {
           console.warn(`Received message from unknown origin: ${event.origin}. Expected: ${expectedOrigin}`);
           return; // Ignore messages from unexpected origins
       }

      const data = event.data;
      // Expecting message structure like { type: 'supabaseAuthResult', success: true, user: {...} }
      if (data && data.type === 'supabaseAuthResult') {
          console.log("Received auth result message from login window:", data);
          if (data.success && data.user) {
              // Call handleLoginSuccess with the user data received from login.html
              handleLoginSuccess(data.user);
               // Close the login window if it's still open
              if (authWindow && !authWindow.closed) {
                  authWindow.close();
                  authWindow = null; // Clear the reference
              }
          } else {
              console.error("Auth flow reported failure from login window:", data.error);
              handleLogout(); // Ensure state is logged out on failure
               // Close the login window if it's still open
              if (authWindow && !authWindow.closed) {
                  authWindow.close();
                  authWindow = null; // Clear the reference
              }
          }
      }
  });


  class SupabaseAuthExtension {
    // Constructor is not strictly needed for simple state like this,
    // state variables can be defined directly in the outer scope or within the class.
    // Using outer scope is common for Scratch extensions to persist state across blocks.
    // constructor() {} // No need for constructor if using outer scope for state

    getInfo() {
        // Initialize Supabase client when Scratch requests extension info
        initializeSupabase();

        return {
            id: 'twSupabaseAuth', // Unique ID for your extension
            name: 'Supabase Auth', // Display name in Scratch
            color1: '#4285F4', // Using Google blue as a base
            color2: '#357AE8',
            color3: '#2A56C6',
            blocks: [
                {
                    opcode: 'login',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'log in with Google (Supabase)',
                    tooltip: 'Opens a window to log in with Google via your Supabase project.',
                },
                {
                    opcode: 'logout', // Renamed from clearData to be more specific
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'log out',
                    tooltip: 'Logs out the current user from Supabase.',
                },
                '---', // Separator
                 {
                    opcode: 'isLoggedIn', // Added this reporter back from original request
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: 'is logged in?',
                     tooltip: 'Reports true if a user is currently authenticated.',
                 },
                {
                    opcode: 'isLoginWindowOpen',
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: 'Is login window open?',
                    tooltip: 'Reports true if the login pop-up window is currently open.',
                },
                {
                    opcode: 'isEmailVerified',
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: 'email verified?', // Adjusted text slightly
                    tooltip: 'Reports true if the logged-in user\'s email address is verified.',
                },
                 '---', // Separator
                {
                    opcode: 'getUserId',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'user ID',
                     tooltip: 'Reports the unique ID of the logged-in user.',
                },
                {
                    opcode: 'getUserEmail', // Mapped from getAccountName
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'user email',
                    tooltip: 'Reports the email address of the logged-in user.',
                },
                {
                    opcode: 'getUserFullName', // Mapped from getFullName
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'user full name',
                    tooltip: 'Reports the full name of the logged-in user (from provider metadata).',
                },
                 {
                    opcode: 'getUserShortName', // Added back from original request
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'user short name', // Assuming first name
                     tooltip: 'Reports the first name of the logged-in user.',
                 },
                {
                    opcode: 'getUserPfpUrl', // Mapped from getProfilePicture, added 256px note
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'user profile picture URL (256px)',
                    tooltip: 'Reports the profile picture URL of the logged-in user, attempting 256px size.',
                },
                 {
                    opcode: 'getUserLocale', // Mapped from getLocale
                    blockType: Scratch.BlockType.REPORTER,
                    text: "user's locale", // Adjusted text
                    tooltip: "Reports the user's preferred language/locale if available (often not provided by OAuth).",
                },
            ],
            // menus: {}, // No custom menus needed based on these blocks
            // docsURI: 'https://ikelene.ca/api/googleAuthDocumentation', // Update if you create new docs
        };
    }

    // Command block implementation for login
    login() {
        // !!! IMPORTANT: Use the exact URL where your login.html is hosted on GitHub Pages !!!
        const loginPageUrl = 'https://colebohte.github.io/river-services/login.html';
        console.log("Opening login window:", loginPageUrl);

        // Check if a window is already open to avoid multiple pop-ups
        if (authWindow && !authWindow.closed) {
             console.log("Login window is already open.");
             authWindow.focus(); // Bring the existing window to front
             return; // Don't open a new one
        }

        // Open login.html in a new window/tab
        authWindow = window.open(loginPageUrl, '_blank', 'width=600,height=700');

         // Note: The actual authentication flow happens in login.html.
         // This extension code just opened the window and will now listen for a postMessage back.
    }

    // Command block implementation for logout (was clearData)
    async logout() {
        if (!supabase || !isSupabaseInitialized) {
             console.error("Supabase client not initialized for logout.");
              // If client isn't initialized, assume no one is logged in via this extension
             handleLogout();
             return;
        }
        try {
            console.log("Attempting to sign out...");
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error during logout:", error);
                 // Even on error, clear local state as an attempt was made
                 handleLogout();
            } else {
                console.log("User signed out successfully via Supabase.");
                // Update internal state on successful sign out
                handleLogout();
            }
        } catch (e) {
             console.error("Exception during Supabase sign out:", e);
             // Clear local state on exception during sign out
             handleLogout();
        }
    }


    // Reporter block implementations

    isLoggedIn() {
      // Reports the internal authentication status
      return isLoggedIn;
    }

    isLoginWindowOpen() {
        // Checks if the window variable exists and is not closed
        return !!(authWindow && !authWindow.closed);
    }

    isEmailVerified() {
        // Supabase user object from OAuth should have email_verified
        // Ensure currentUser exists before accessing properties
        return currentUser ? (currentUser.email_verified === true) : false;
    }

    getUserId() {
        return currentUser ? currentUser.id : '';
    }

    getUserEmail() { // Maps to Account Email
        return currentUser ? currentUser.email : '';
    }

    getUserFullName() { // Maps to Full Name
       // Access user_metadata and then full_name
      return currentUser && currentUser.user_metadata ? (currentUser.user_metadata.full_name || '') : '';
    }

     getUserShortName() { // Added back, assumes first name
        const fullName = this.getUserFullName();
        if (fullName) {
            const parts = fullName.split(' ');
            return parts[0] || '';
        }
        return '';
    }


    getUserPfpUrl() { // Maps to Profile Picture URL, adds 256px logic
        // Access user_metadata and then avatar_url
        const avatarUrl = currentUser && currentUser.user_metadata ? (currentUser.user_metadata.avatar_url || '') : '';
        if (avatarUrl) {
            // Attempt to modify Google's size parameter (e.g., from s96-c to s256-c)
            try {
                const url = new URL(avatarUrl);
                 // Check for Google user content domains
                if (url.hostname.includes('googleusercontent.com') || url.hostname.includes('ggpht.com')) {
                    const params = url.searchParams;
                    const sizeParam = params.get('s');

                    if (sizeParam) {
                        // Replace size with 256
                        params.set('s', '256');
                        // Rebuild and return the URL
                        url.search = params.toString();
                        return url.toString();
                    }
                     // If no 's' param, return original
                     return avatarUrl;
                } else {
                     // Not a Google domain, return original
                    return avatarUrl;
                }
            } catch (e) {
                console.error("Error processing avatar URL:", e);
                // Return original on error
                return avatarUrl;
            }
        }
        return ''; // Return empty string if no URL
    }

    getUserLocale() { // Maps to User's preferred language (Locale)
        // Supabase user metadata from Google OAuth often doesn't include locale by default
        // You might need to request 'profile' and potentially other scopes, and check if Supabase
        // stores it in user_metadata. It's not guaranteed.
        // Returning an empty string if not found is safer.
        return currentUser && currentUser.user_metadata ? (currentUser.user_metadata.locale || '') : '';
    }
  }

   // Register the extension once the Scratch environment is available
    if (typeof Scratch !== 'undefined') {
        Scratch.extensions.register(new SupabaseAuthExtension());
        console.log("Supabase Auth Extension registered.");
    } else {
        console.error("Scratch environment not found. Could not register extension.");
    }

})(Scratch);
