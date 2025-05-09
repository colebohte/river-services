// TurboWarp Extension for Supabase Google Authentication via Popup
// This extension opens a popup window for the Google OAuth flow
// and receives the user session data back via postMessage.

(function (Scratch) {
  // --- Configuration ---
  // Replace with your actual Supabase Project URL and Anon Key
  const SUPABASE_URL = "https://gxqbrcutslyybxexvszr.supabase.co"; // e.g., "https://gxqbrcutslyybxexvszr.supabase.co"
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWJyY3V0c2x5eWJ4ZXh2c3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTMxODYsImV4cCI6MjA2MjMyOTE4Nn0.yBF90TTgVBVihO5rH0HpK4DvKFfy4fGm3ps05vKeDjU"; // Your project's public anon key

  // Replace with the EXACT URL where you host your login.html file
  // This URL is used in window.open() to launch the popup.
  // This page MUST be hosted online (e.g., GitHub Pages) for the OAuth redirect to work.
  const LOGIN_PAGE_URL = "https://colebohte.github.io/river-services/login.html"; // e.g., "https://colebohte.github.io/river-services/login.html"

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
          if (event.origin === new URL(LOGIN_PAGE_URL).origin) {
            if (event.data && event.data.type === "supabase-auth") {
              // Update the user data when received from the popup
              this.user = event.data.user;
              console.log("Supabase user data received:", this.user); // Log for debugging
              // You could add a custom event or broadcast a Scratch message here
              // to notify your Scratch project that the user state has changed.
              // Example: Scratch.vm.runtime.emit('LOGIN_SUCCESS', this.user);
            }
          } else {
            console.warn("Received message from untrusted origin:", event.origin);
          }
        });

         // Optional: Check for an existing session when the extension loads
         // This can happen if the user previously logged in and the session is still valid
         supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              this.user = session.user;
              console.log("Existing Supabase session found:", this.user); // Log for debugging
              // You might want to notify Scratch project here too
            }
         }).catch(err => {
             console.error("Error checking initial session:", err); // Log error
         });

        // Optional: Listen for auth state changes (less critical for popup flow, but good practice)
        supabase.auth.onAuthStateChange((_event, session) => {
           // This listener might not always fire reliably for the popup flow compared to postMessage,
           // but it can catch state changes initiated elsewhere or on initial load.
           console.log("Auth state changed event:", _event, "session:", session); // Log for debugging
           // We primarily rely on the postMessage listener to update this.user for the popup flow.
           // However, keeping this can help sync state in other scenarios.
           if (_event === 'SIGNED_OUT') {
               this.user = null;
               console.log("User signed out via auth state change.");
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
              opcode: "signIn",
              blockType: Scratch.BlockType.COMMAND, // Command block (runs an action)
              text: "sign in with Google"
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
             { // Optional: Add a block to check if the user is logged in
              opcode: "isLoggedIn",
              blockType: Scratch.BlockType.BOOLEAN, // Boolean block (returns true/false)
              text: "is logged in?"
            },
             { // Optional: Add a sign out block
              opcode: "signOut",
              blockType: Scratch.BlockType.COMMAND, // Command block
              text: "sign out"
            }
          ]
        };
      }

      // --- Block Implementations ---

      // Implementation for the "sign in with Google" command block
      signIn() {
        // Open the login.html page in a new window/tab
        // This establishes the window.opener relationship needed for postMessage
        window.open(
          LOGIN_PAGE_URL, // Use the defined URL for your login.html
          "_blank", // Open in a new blank tab/window
          "width=500,height=600,resizable=yes,scrollbars=yes" // Features for the popup window
        );
        // Note: The actual Supabase signInWithOAuth call happens inside login.html
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
