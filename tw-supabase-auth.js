// TurboWarp Extension for Supabase Google Authentication via Popup
// This extension opens a popup window for the Google OAuth flow
// and receives the user session data back via postMessage.
// Added features to get more user details from Google profile metadata,
// including a block for the profile picture URL with customizable size, and categorized blocks.
// Added a block to sign the user out.

(function (Scratch) {
  // --- Configuration ---
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWJyY3V0c2x5eWJ4ZXh2c3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTMxODYsImV4cCI6MjA2MjMyOTE4Nn0.yBF90TTgVBVihO5rH0HpK4DvKFfy4fGm3ps05vKeDjU"; // Your project's public anon key

  // Replace with the EXACT URL where you host your login.html file
  // This URL is used in window.open() to launch the popup.
  // This URL is used in window.open() to launch the popup from the extension.
  // This page MUST be hosted online (e.g., GitHub Pages) for the OAuth redirect to work.
  const LOGIN_PAGE_URL = "https://colebohte.github.io/river-services/login.html"; // e.g., "https://colebohte.github.io/river-services/login.html"

  // IMPORTANT: Set this to the EXACT origin of the window running your TurboWarp project.
  // This is crucial for security in postMessage.
  // IMPORTANT: This variable is a reference for what the 'targetOrigin'
  // in your login.html's window.opener.postMessage() call MUST be set to.
  // It should be the EXACT origin of the window running your TurboWarp project.
  // - If using turbowarp.org editor: "https://turbowarp.org"
  // - If embedding on your own web page: "https://your-embedding-domain.com" (e.g., "https://colebohte.github.io")
  // - If running in Electron or TurboWarp Desktop: "file://"
  const TURBOWARP_ORIGIN = "file://"; // <--- Set this based on your target environment!
  // Ensure the 'targetOrigin' in your login.html matches this value for security.
  const EXPECTED_TURBOWARP_ORIGIN_FOR_POSTMESSAGE = "file://"; // <--- Set this based on your target environment!

  // --- Supabase Client Initialization ---
  const script = document.createElement("script");
      constructor() {
        this.user = null; // Stores the logged-in user object

        // Listen for messages from the popup window
        // Listen for messages from the popup window (login.html)
        // The login.html page will send the user data back via postMessage
        window.addEventListener("message", (event) => {
          // IMPORTANT: Verify the origin of the message for security!
          // Ensure the message is coming from your trusted login page origin.
          // This check ensures the message is coming from your trusted login page origin.
          // This origin check remains based on the hosted login.html URL.
          if (event.origin === new URL(LOGIN_PAGE_URL).origin) {
            if (event.data && event.data.type === "supabase-auth") {
              opcode: "signIn",
              blockType: Scratch.BlockType.COMMAND, // Command block (runs an action)
              text: "sign in with Google"
            },
             { // Block to sign out
              opcode: "signOut",
              blockType: Scratch.BlockType.COMMAND, // Command block
              text: "sign out"
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
            },
            // --- Categorized User Data Blocks ---
            { // Label block for categorization
            },
            {
              opcode: "getFullName",
              blockType: Scratch.BlockType.REPORTER,
              blockType: Scratch.ArgumentType.REPORTER, // Corrected type here
              text: "full name"
            },
            {
              opcode: "getShortName",
              blockType: Scratch.BlockType.REPORTER,
              blockType: Scratch.ArgumentType.REPORTER, // Corrected type here
              text: "short name"
            },
            {
              opcode: "getLanguage",
              blockType: Scratch.BlockType.REPORTER,
              blockType: Scratch.ArgumentType.REPORTER,
              text: "language"
            },
            {
              opcode: "getRegion",
              blockType: Scratch.BlockType.REPORTER,
              blockType: Scratch.ArgumentType.REPORTER,
              text: "region"
            },
            {
          "width=500,height=600,resizable=yes,scrollbars=yes" // Features for the popup window
        );
        // Note: The actual Supabase signInWithOAuth call happens inside login.html
        // The logic to force account selection is also in login.html
      }

      // Implementation for the "sign out" command block
       async signOut() {
         // Call Supabase sign out. This clears the local session.
         // The login.html page will handle forcing the account selection
         // the next time it's opened.
         const { error } = await supabase.auth.signOut();
         if (!error) {
            this.user = null; // Clear local user state on successful sign out
            console.log("User signed out successfully."); // Log for debugging
             // You might want to broadcast a Scratch message here to update UI
         } else {
            console.error("Sign out failed:", error.message); // Log error
         }
       }


      // Implementation for the "user email" reporter block
      getEmail() {
        // Return the email from the stored user object, or an empty string if not logged in
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

       // --- Implementations for User Details Blocks ---

       // Implementation for "profile picture URL" reporter block (existing)
       getProfilePicUrl() {
           // Google profile picture URL is typically in user_metadata.avatar_url
           return this.user?.user_metadata?.avatar_url ?? "";
       }

        // Implementation for the new "profile pic URL size [SIZE]" reporter block
        // Accepts a 'size' argument from the block
        getProfilePicSizedUrl(args) {
            const avatarUrl = this.user?.user_metadata?.avatar_url;
            if (!avatarUrl) {
                return ""; // Return empty string if no avatar URL is available
            }

            const size = args.SIZE; // Get the size value from the block arguments

            // Google profile picture URLs often have a size parameter like "=s96-c"
            // We can try to replace or append the size parameter.
            // This is a common pattern, but not guaranteed by Google.
            try {
                const url = new URL(avatarUrl);
                 // Remove any existing size parameter (starts with =s followed by digits)
                url.search = url.search.replace(/=s\d+(-c)?/, ''); // Also handle URLs without -c
                // Append the desired size parameter
                url.search += (url.search ? '&' : '') + 's' + size + '-c'; // Append size and -c
                return url.toString();
            } catch (e) {
                console.error("Error modifying profile picture URL:", e);
                return avatarUrl; // Return the original URL if modification fails
            }
        }


       // Implementation for "full name" reporter block
       getFullName() {
           // Full name is typically in user_metadata.full_name or user_metadata.name
           return this.user?.user_metadata?.full_name ?? this.user?.user_metadata?.name ?? "";
       }

       // Implementation for "short name" reporter block
       getShortName() {
           // Short name might be in user_metadata.user_name or similar, or derived from full name
           // This is less standard, let's use user_metadata.user_name if available, or part of full name
           return this.user?.user_metadata?.user_name ?? this.user?.user_metadata?.name?.split(' ')[0] ?? "";
       }

       // Implementation for "language" reporter block
       getLanguage() {
            // Language is often available in user_metadata.locale
           return this.user?.user_metadata?.locale ?? "";
       }

       // Implementation for "region" reporter block
       getRegion() {
           // Region is not standard in Google OAuth user_metadata. Locale might contain it (e.g., "en-CA").
           // We'll return the locale for now, or you might need to parse it.
           // If you need a specific region code, you might need a lookup based on locale.
           return this.user?.user_metadata?.locale ?? ""; // Returning locale as region often isn't separate
       }

       // Implementation for "is email verified?" boolean block
       isEmailVerified() {
           // Supabase user object has email_confirmed_at. If it's not null, the email is verified.
           return this.user?.email_confirmed_at !== null && this.user?.email_confirmed_at !== undefined;
       }
    }

    // Register the extension with Scratch/TurboWarp
    Scratch.extensions.register(new SupabaseAuthExtension());
  };

  // Append the Supabase script to the document head to load it
  document.head.appendChild(script);

})(Scratch);
