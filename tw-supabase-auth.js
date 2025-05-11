// TurboWarp Extension for Supabase Google Authentication via Popup
// This extension opens a popup window for the Google OAuth flow
// and receives the user session data back via postMessage.
// Added features to get more user details from Google profile metadata,
// including a block for the profile picture URL (format depends on Google).
// including a block for the profile picture URL with customizable size, and categorized blocks.

(function (Scratch) {
  // --- Configuration ---
  // Replace with your actual Supabase Project URL and Anon Key
  const SUPABASE_URL = "https://gxqbrcutslyybxexvszr.supabase.co"; // e.g., "https://gxqbrcutslyybxexvszr.supabase.co"
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWJyY3V0c2x5eWJ4ZXh2c3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTMxODYsImV4cCI6MjA2MjMyOTE4Nn0.yBF90TTgVBVihO5rH0HpK4DvKFfy4fGm3ps05vKeDjUY"; // Your project's public anon key
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWJyY3V0c2x5eWJ4ZXh2c3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTMxODYsImV4cCI6MjA2MjMyOTE4Nn0.yBF90TTgVBVihO5rH0HpK4DvKFfy4fGm3ps05vKeDjU"; // Your project's public anon key

  // Replace with the EXACT URL where you host your login.html file
  // This URL is used in window.open() to launch the popup.
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
              blockType: Scratch.BlockType.COMMAND, // Command block
              text: "sign out"
            },
            // --- Blocks for User Details ---
            // --- Categorized User Data Blocks ---
            { // Label block for categorization
              blockType: Scratch.BlockType.LABEL,
              text: "Returned User Data"
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
            {
              opcode: "getProfilePicUrl",
              blockType: Scratch.BlockType.REPORTER,
              text: "profile picture URL"
              text: "profile picture URL (default size)" // Clarified text
            },
             { // New block for profile pic URL (specifically requested)
              opcode: "getProfilePicPngUrl",
             { // Modified block for profile pic URL with customizable size
              opcode: "getProfilePicSizedUrl", // Changed opcode name
              blockType: Scratch.BlockType.REPORTER,
              text: "profile pic png url" // Text for the new block
              text: "profile pic URL size [SIZE]", // Text with input slot
              arguments: {
                  SIZE: { // Define the input argument
                      type: Scratch.ArgumentType.NUMBER, // Expect a number input
                      defaultValue: 156 // Default size
                  }
              }
            },
            {
              opcode: "getFullName",
           return this.user?.user_metadata?.avatar_url ?? "";
       }

        // Implementation for the new "profile pic png url" reporter block
        getProfilePicPngUrl() {
            // Google's avatar_url typically provides a direct link to the image.
            // The format (PNG, JPG, etc.) is determined by the image itself.
            // We are returning the direct URL provided by Google/Supabase.
            // We cannot guarantee it's always PNG unless Google provides a specific URL parameter for that.
            return this.user?.user_metadata?.avatar_url ?? "";
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
