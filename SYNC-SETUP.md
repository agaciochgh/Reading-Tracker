# Turning on family sync

Sync uses **Firebase**, Google's free app database. You set it up once (about 10 minutes). After that, every tablet and phone signed in to your family account shares the same readers, books, history and parent PIN.

## How long is the data kept?

- **Until you delete it.** Firebase's free plan has no expiry date on stored data, and your family account doesn't expire either.
- **It's well within the free limits.** The free plan includes 1 GB of storage and 20,000 saves a day. A year of reading for three kids is well under 1 MB, so you won't come near paying.
- **Each device also keeps its own copy,** so the app still works offline. Changes made offline upload when the device reconnects.
- **Only your family account can read it.** The security rules in `firestore.rules` make sure of that.
- For peace of mind, use **Parent settings → Export** now and then to save a backup file too.

## One-time setup

1. Go to <https://console.firebase.google.com> and sign in with your Google account.
2. Click **Create a project**. Name it something like `reading-quest`. You can switch Google Analytics **off**.
3. **Turn on email sign-in:** in the left menu choose **Build → Authentication → Get started**. Under **Sign-in method**, pick **Email/Password**, switch on the first toggle, and click **Save**.
4. **Allow your website:** still in Authentication, open the **Settings** tab → **Authorized domains** → **Add domain**, and enter `agaciochgh.github.io`.
5. **Create the database:** go to **Build → Firestore Database → Create database**. Pick a location near you and choose **Start in production mode**.
6. **Lock it down:** open the **Rules** tab. Replace everything there with the contents of [`firestore.rules`](firestore.rules), then click **Publish**.
7. **Get your app's settings:** click the ⚙️ next to *Project Overview* → **Project settings**. Under **Your apps**, click the **`</>`** (Web) icon, give it a nickname, and click **Register app**. Leave "Firebase Hosting" unticked. You'll see a block like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIza…",
     authDomain: "reading-quest-xxxx.firebaseapp.com",
     projectId: "reading-quest-xxxx",
     storageBucket: "…",
     messagingSenderId: "…",
     appId: "…"
   };
   ```

   These values identify your project. They aren't passwords, so it's fine to share them or put them on GitHub. (Your password and the security rules are what protect the data.)
8. **Put them in the app.** Either paste them to Claude, or edit [`sync-config.js`](sync-config.js) on GitHub yourself (open the file → ✏️ pencil icon). Replace `null` with the `{ … }` part, then **Commit changes**:

   ```js
   window.READING_QUEST_FIREBASE = { apiKey: "AIza…", authDomain: "…", projectId: "…", storageBucket: "…", messagingSenderId: "…", appId: "…" };
   ```

## Using it

1. On the device that already has your kids' reading, open **Parent settings → Family sync**. Enter an email and password and tap **Create account**. Everything on that device uploads.
2. On every other device, open the app. Tap **Sign in to your family account** (or go to Parent settings) and sign in with the same email and password.
3. That's it. Changes appear on the other devices within a second or two.

**Optional (recommended):** once you've created your family account, go to Firebase → **Authentication → Settings → User actions** and untick **Enable create (sign-up)**. Then nobody else can create accounts on your project.

## Parent PIN

Set it in **Parent settings → Parent PIN**. It syncs to all your devices. It protects Parent settings and deleting books or reading history. Tap **🔒 Lock** when you're done. Settings also lock by themselves after 2 minutes without a tap, or when you switch away from the app. If you forget it, tap **Forgot?** and answer the grown-up maths question to get in and set a new one.

The PIN is a kid-proof lock, not bank-grade security. Your family account password is what protects the data itself.
