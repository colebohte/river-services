(function (Scratch) {
  const SUPABASE_URL = "https://gxqbrcutslyybxexvszr.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWJyY3V0c2x5eWJ4ZXh2c3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTMxODYsImV4cCI6MjA2MjMyOTE4Nn0.yBF90TTgVBVihO5rH0HpK4DvKFfy4fGm3ps05vKeDjU";

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js";
  script.onload = () => {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    class SupabaseAuthExtension {
      constructor() {
        this.user = null;

        // Listen for messages from the login popup
        window.addEventListener("message", (event) => {
          // Validate the origin of the message
          if (event.origin.startsWith("https://your-username.github.io")) {
            if (event.data.type === "supabase-auth") {
              // Set the user data when the message is received
              this.user = event.data.user;
            }
          }
        });
      }

      // This is the info that TurboWarp uses to register the extension
      getInfo() {
        return {
          id: "supabaseAuth", // Unique ID for the extension
          name: "Supabase Auth", // Name of the extension
          color1: "#3ECF8E", // Main color for the extension
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

      // Sign in with Google: opens the login popup
      signIn() {
        window.open(
          "https://your-username.github.io/tw-auth-app/login.html",
          "_blank",
          "width=500,height=600"
        );
      }

      // Get the user's email
      getEmail() {
        return this.user?.email ?? "";
      }

      // Get the user's UID
      getUID() {
        return this.user?.id ?? "";
      }
    }

    // Register the extension with TurboWarp
    Scratch.extensions.register(new SupabaseAuthExtension());
  };
  document.head.appendChild(script);
})(Scratch);
