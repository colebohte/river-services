(function (Scratch) {
  // Supabase URL and API key
  const SUPABASE_URL = "https://gxqbrcutslyybxexvszr.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWJyY3V0c2x5eWJ4ZXh2c3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTMxODYsImV4cCI6MjA2MjMyOTE4Nn0.yBF90TTgVBVihO5rH0HpK4DvKFfy4fGm3ps05vKeDjU";

  // Load the Supabase JavaScript SDK
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js";
  script.onload = () => {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create the extension for TurboWarp
    class SupabaseAuthExtension {
      constructor() {
        this.user = null;  // Stores user data (email, UID)

        // Listen for messages from the login popup
        window.addEventListener("message", (event) => {
          // Ensure the message comes from your GitHub Pages domain
          if (event.origin.startsWith("https://colebohte.github.io")) {
            if (event.data.type === "supabase-auth") {
              // Store the user data when authentication is successful
              this.user = event.data.user;
            }
          }
        });
      }

      // Extension metadata: Registering blocks and their functionalities
      getInfo() {
        return {
          id: "supabaseAuth", // Unique identifier for the extension
          name: "Supabase Auth", // Display name for the extension
          color1: "#3ECF8E", // Main color for the extension's blocks
          blocks: [
            {
              opcode: "signIn", // Sign in block
              blockType: Scratch.BlockType.COMMAND,
              text: "sign in with Google",
              func: this.signIn.bind(this), // Calls the signIn function
            },
            {
              opcode: "getEmail", // Get email block
              blockType: Scratch.BlockType.REPORTER,
              text: "user email",
              func: this.getEmail.bind(this), // Calls the getEmail function
            },
            {
              opcode: "getUID", // Get UID block
              blockType: Scratch.BlockType.REPORTER,
              text: "user UID",
              func: this.getUID.bind(this), // Calls the getUID function
            },
          ],
        };
      }

      // Function to open the Google sign-in popup
      signIn() {
        window.open(
          "https://colebohte.io/river-services/login.html", // URL to your login page
          "_blank",  // Open in a new window
          "width=500,height=600"  // Set the size of the popup
        );
      }

      // Function to return the user's email (if logged in)
      getEmail() {
        return this.user?.email ?? "Not logged in"; // Return email or a default message
      }

      // Function to return the user's UID (if logged in)
      getUID() {
        return this.user?.id ?? "Not logged in"; // Return UID or a default message
      }
    }

    // Register the custom extension with TurboWarp
    Scratch.extensions.register(new SupabaseAuthExtension());
  };

  // Append the script to the document head to load the Supabase SDK
  document.head.appendChild(script);
})(Scratch);
