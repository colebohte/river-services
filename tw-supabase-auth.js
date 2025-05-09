(function (Scratch) {
  // Replace with your actual Supabase URL and Anon Key
  const SUPABASE_URL = "https://gxqbrcutslyybxexvszr.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWJyY3V0c2x5eWJ4ZXh2c3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTMxODYsImV4cCI6MjA2MjMyOTE4Nn0.yBF90TTgVBVihO5rH0HpK4DvKFfy4fGm3ps05vKeDjU";

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js";
  script.onload = () => {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    class SupabaseAuthExtension {
      constructor() {
        this.user = null;

        // Listen for messages from the popup window
        window.addEventListener("message", (event) => {
          // Important: Verify the origin of the message for security
          // Replace 'https://your-username.github.io' with the actual domain where you host login.html
          if (event.origin.startsWith("https://colebohte.github.io")) {
            if (event.data.type === "supabase-auth") {
              // Update the user data when received from the popup
              this.user = event.data.user;
              console.log("Supabase user data received:", this.user); // Log for debugging
              // You might want to add a custom event or broadcast a Scratch message here
              // to notify your Scratch project that the user is logged in.
            }
          }
        });

         // Check for existing session on load
         supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              this.user = session.user;
              console.log("Existing Supabase session found:", this.user); // Log for debugging
            }
         });

        // Listen for auth state changes (though with popup, postMessage is primary)
        supabase.auth.onAuthStateChange((_event, session) => {
           // This might not fire reliably for the popup flow, the postMessage listener is key
           console.log("Auth state changed event:", _event, "session:", session); // Log for debugging
           this.user = session?.user ?? null;
        });
      }

      getInfo() {
        return {
          id: "supabaseAuth",
          name: "Supabase Auth",
          color1: "#3ECF8E", // Supabase green!
          blocks: [
            {
              opcode: "signIn",
              blockType: Scratch.BlockType.COMMAND,
              text: "sign in with Google"
            },
            {
              opcode: "getEmail",
              blockType: Scratch.BlockType.REPORTER,
              text: "user email"
            },
            {
              opcode: "getUID",
              blockType: Scratch.BlockType.REPORTER,
              text: "user UID"
            },
             { // Optional: Add a block to check if the user is logged in
              opcode: "isLoggedIn",
              blockType: Scratch.BlockType.BOOLEAN,
              text: "is logged in?"
            },
             { // Optional: Add a sign out block
              opcode: "signOut",
              blockType: Scratch.BlockType.COMMAND,
              text: "sign out"
            }
          ]
        };
      }

      // Block to open the login popup
      signIn() {
        // Open the login.html page in a new window
        // Replace 'https://your-username.github.io/tw-auth-app/login.html'
        // with the actual URL where you host your login.html file.
        window.open(
          "https://colebohte.github.io/river-services/login.html",
          "_blank", // Open in a new tab/window
          "width=500,height=600,resizable=yes,scrollbars=yes" // Features for the popup
        );
      }

      // Reporter block to get the user's email
      getEmail() {
        return this.user?.email ?? "";
      }

      // Reporter block to get the user's UID
      getUID() {
        return this.user?.id ?? "";
      }

      // Optional: Boolean block to check login status
      isLoggedIn() {
         return this.user !== null;
      }

       // Optional: Sign out block
       async signOut() {
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

    Scratch.extensions.register(new SupabaseAuthExtension());
  };

  document.head.appendChild(script);
})(Scratch);
