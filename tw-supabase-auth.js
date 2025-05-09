(function (Scratch) {
  // Supabase credentials (replace these with your actual credentials)
  const SUPABASE_URL = "https://gxqbrcutslyybxexvszr.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWJyY3V0c2x5eWJ4ZXh2c3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTMxODYsImV4cCI6MjA2MjMyOTE4Nn0.yBF90TTgVBVihO5rH0HpK4DvKFfy4fGm3ps05vKeDjU"; // Replace with your actual key

  // Load the Supabase JavaScript SDK
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js";
  script.onload = () => {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create the extension class
    class SupabaseAuthExtension {
      constructor() {
        this.user = null;  // Store user data (email, UID)

        // Listen for messages from the login popup
        window.addEventListener("message", (event) => {
          // Validate the origin to make sure it's the right source
          if (event.origin.startsWith("https://colebohte.github.io")) {
            if (event.data.type === "supabase-auth") {
              // Set the user data when received from the popup
              this.user = event.data.user;
            }
          }
        });
      }

      // This is the info that TurboWarp uses to register the extension
      getInfo() {
        return {
          id: "supabaseAuth", // Unique ID for the extension
          name: "Supabase Auth", // Display name for the extension
          color1: "#3ECF8E", // Main color for the extension blocks
          blocks: [
            {
              opcode: "signIn", // Command block to trigger login
              blockType: Scratch.BlockType.COMMAND,
              text: "sign in with Google",
              func: this.signIn.bind(this),
            },
            {
              opcode: "getEmail", // Reporter block to get the email
              blockType: Scratch.BlockType.REPORTER,
              text: "user email",
              func: this.getEmail.bind(this),
            },
            {
              opcode: "getUID", // Reporter block to get the UID
              blockType: Scratch.BlockType.REPORTER,
              text: "user UID",
              func: this.getUID.bind(this),
            },
          ],
        };
      }

      // Function to open the Google sign-in popup
      signIn() {
        console.log("Opening login popup...");

        const loginWindow = window.open(
          "https://colebohte.io/river-services/login.html",  // The URL where the Google login is hosted
          "_blank",
          "width=500,height=600"
        );

        if (!loginWindow) {
          console.error("Popup blocked, please allow popups for this site.");
        }
      }

      // Function to return the user's email
      getEmail() {
        return this.user?.email ?? "Not logged in";
      }

      // Function to return the user's UID
      getUID() {
        return this.user?.id ?? "Not logged in";
      }
    }

    // Register the extension with TurboWarp
    Scratch.extensions.register(new SupabaseAuthExtension());
  };

  // Append the script to the document head to load the Supabase SDK
  document.head.appendChild(script);
})(Scratch);
