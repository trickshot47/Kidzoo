<p align="center">
  <img src="common/public/icon_filled.png" width="200" alt="KidZoo">
</p>
<h1 align="center">KidZoo</h1>
<h4 align="center"><b>Your personal anime streaming platform.</b></h4>

## 📃 **About**

**KidZoo** is a fast, lightweight anime streaming website built with Svelte. It integrates seamlessly with AniList and MyAnimeList to track your watch progress in real-time. Simply log in with your tracker account, browse the latest anime, and start streaming!

## ✨ Key Features:
- 🪄 **Tracker Integration** - Login with AniList or MyAnimeList to automatically sync your watch progress.
- 📺 **Instant Streaming** - Start watching immediately using the built-in AniKoto streaming provider.
- 📱 **Mobile Friendly** - A fully responsive web interface that works great on phones and tablets.
- 🎨 **Beautiful UI** - Dark mode by default with customizable themes and a clean, ad-free interface.
- 🔔 **Notifications** - Get alerts for new sub and dub releases of your tracked anime.

## ⚙️ **Running Locally**

KidZoo is a modern web application built using Svelte and Webpack.

### 📋 Requirements:
- NodeJS 22+
- pnpm (Package Manager)

### 💻 Starting the Development Server:
1. Navigate to the project root:
   ```bash
   cd Shiru-web
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the Webpack Development Server:
   ```bash
   pnpm --filter web dev
   ```
4. Start the AniKoto API (in a separate terminal):
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`

## 📜 License
This project follows the [GPLv3 License](LICENSE).
