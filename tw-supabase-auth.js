// TurboWarp Extension for Supabase Google and Discord Authentication via Popup
// This extension opens a popup window for the OAuth flow
// and receives the user session data back via postMessage.

(function (Scratch) {
  // --- Configuration ---
  // Replace with your actual Supabase Project URL and Anon Key
  const SUPABASE_URL = "https://gxqbrcutslyybxexvszr.supabase.co"; // e.g., "https://gxqbrcutslyybxexvszr.supabase.co"
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWJyY3V0c2x5eWJ4ZXh2c3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTMxODYsImV4cCI6MjA2MjMyOTE4Nn0.yBF90TTgVBVihO5rH0HpK4DvKFfy4fGm3ps05vKeDjU"; // Your project's public anon key

  // Replace with the EXACT URL where you host your login.html file
  // This URL is used in window.open() to launch the popup.
  // This page MUST be hosted online (e.g., GitHub Pages) for the OAuth redirect to work.
  const LOGIN_PAGE_BASE_URL = "https://colebohte.github.io/river-services/login.html"; // e.g., "https://colebohte.github.io/river-services/login.html"

  // IMPORTANT: Set this to the EXACT origin of the window running your TurboWarp project.
  // This is crucial for security in postMessage.
  // - If using turbowarp.org editor: "https://turbowarp.org"
  // - If embedding on your own web page: "https://your-embedding-domain.com" (e.g., "https://colebohte.github.io")
  // - If running in Electron or TurboWarp Desktop: "file://"
  const TURBOWARP_ORIGIN = "file://"; // <--- Set this based on your target environment!

  // --- Supabase Client Initialization ---
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js";
  script.onload = () => {
    // Initialize the Supabase client once the script is loaded
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- TurboWarp Extension Definition ---
    class SupabaseAuthExtension {
      constructor() {
        this.user = null; // Stores the logged-in user object

        // Listen for messages from the popup window
        // The login.html page will send the user data back using postMessage
        window.addEventListener("message", (event) => {
          // IMPORTANT: Verify the origin of the message for security!
          // Ensure the message is coming from your trusted login page origin.
          // This origin check remains based on the hosted login.html URL.
          if (event.origin === new URL(LOGIN_PAGE_BASE_URL).origin) {
            if (event.data && event.data.type === "supabase-auth") {
              // Update the user data when received from the popup
              this.user = event.data.user;
              console.log("Supabase user data received."); // Simplified log
            }
          } else {
            console.warn("Received message from untrusted origin:", event.origin);
          }
        });

         // Check for an existing session when the extension loads
         supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              this.user = session.user;
              console.log("Existing Supabase session found."); // Simplified log
            }
         }).catch(err => {
             console.error("Error checking initial session:", err);
         });

        // Listen for auth state changes (primarily for sign-out if implemented elsewhere)
        supabase.auth.onAuthStateChange((_event, session) => {
           if (_event === 'SIGNED_OUT') {
               this.user = null;
               console.log("User signed out."); // Simplified log
           }
        });
      }

      // --- Extension Block Definitions ---
      getInfo() {
        return {
          id: "supabaseAuth", // Unique ID for the extension
          name: "Supabase Auth", // Display name in TurboWarp
          color1: "#3ECF8E", // Supabase green color for blocks
          blocks: [
            {
              opcode: "signInGoogle",
              blockType: Scratch.BlockType.COMMAND, // Command block (runs an action)
              text: "sign in with Google"
            },
             {
              opcode: "signInDiscord",
              blockType: Scratch.BlockType.COMMAND, // Command block
              text: "sign in with Discord"
            },
            {
              opcode: "getEmail",
              blockType: Scratch.BlockType.REPORTER, // Reporter block (returns a value)
              text: "user email"
            },
            {
              opcode: "getUID",
              blockType: Scratch.BlockType.REPORTER, // Reporter block (returns a value)
              text: "user UID"
            },
             { // Add block to get user's full name from metadata
              opcode: "getFullName",
              blockType: Scratch.BlockType.REPORTER,
              text: "user full name"
            },
             { // Add block to get user's avatar URL from metadata
              opcode: "getAvatarURL",
              blockType: Scratch.BlockType.REPORTER,
              text: "user avatar URL"
            },
             { // Add block to check if the user is logged in
              opcode: "isLoggedIn",
              blockType: Scratch.BlockType.BOOLEAN, // Boolean block (returns true/false)
              text: "is logged in?"
            },
             { // Add a sign out block
              opcode: "signOut",
              blockType: Scratch.BlockType.COMMAND, // Command block
              text: "sign out"
            }
          ]
        };
      }

      // --- Block Implementations ---

      // Implementation for the "sign in with Google" command block
      signInGoogle() {
        // Open the login.html page with a parameter for Google auth
        window.open(
          `${LOGIN_PAGE_BASE_URL}?provider=google`, // Add provider parameter
          "_blank", // Open in a new blank tab/window
          "width=500,height=600,resizable=yes,scrollbars=yes" // Features for the popup window
        );
      }

       // Implementation for the "sign in with Discord" command block
      signInDiscord() {
        // Open the login.html page with a parameter for Discord auth
        window.open(
          `${LOGIN_PAGE_BASE_URL}?provider=discord`, // Add provider parameter
          "_blank", // Open in a new blank tab/window
          "width=500,height=600,resizable=yes,scrollbars=yes" // Features for the popup window
        );
      }

      // Implementation for the "user email" reporter block
      getEmail() {
        // Return the email from the stored user object, or an empty string if not logged in
        return this.user?.email ?? "";
      }

      // Implementation for the "user UID" reporter block
      getUID() {
        // Return the UID from the stored user object, or an empty string if not logged in
        return this.user?.id ?? "";
      }

      // Implementation for the "user full name" reporter block
      getFullName() {
        // Return the full name from user_metadata, or an empty string
        return this.user?.user_metadata?.full_name ?? "";
      }

      // Implementation for the "user avatar URL" reporter block
      getAvatarURL() {
        // Return the avatar URL from user_metadata, or an empty string
        return this.user?.user_metadata?.avatar_url ?? "";
      }


      // Implementation for the "is logged in?" boolean block
      isLoggedIn() {
         // Return true if the user object is not null, false otherwise
         return this.user !== null;
      }

       // Implementation for the "sign out" command block
       async signOut() {
         // Call Supabase sign out
         const { error } = await supabase.auth.signOut();
         if (!error) {
            this.user = null; // Clear local user state on successful sign out
            console.log("User signed out successfully."); // Log for debugging
             // You might want to broadcast a Scratch message here to update UI
         } else {
            console.error("Sign out failed:", error.message); // Log error
         }
       }
    }

    // Register the extension with Scratch/TurboWarp
    Scratch.extensions.register(new SupabaseAuthExtension());
  };

  // Append the Supabase script to the document head to load it
  document.head.appendChild(script);

})(Scratch);
