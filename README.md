# MAL Recommendation Generator

A highly personalized anime and manga recommendation system powered by **MyAnimeList (MAL)** and **Supabase**. This application goes beyond simple suggestions by combining **content-based filtering** with **collaborative filtering** (Hybrid Engine) to provide accurate, tailored recommendations based on your unique watch history and preferences.

![MAL Recommendation Generator](public/logo.png)

## 🚀 Key Features

### 🧠 Intelligent Recommendation Engine
*   **Hybrid Algorithm:** Combines 70% Content-Based (genres, studios, authors) and 30% Collaborative Filtering (user similarity) for diverse and relevant results.
*   **Preferences System:** Customize your feed by selecting favorite genres, excluding dislikes, and setting minimum score thresholds.
*   **Smart Filtering:** Automatically excludes "Plan to Watch", "Dropped", and "Completed" entries to show you only fresh content.
*   **Similar User Matching:** Finds users with similar taste profiles (Jaccard similarity) to surface hidden gems.

### ⚡ Performance & Experience
*   **Instant Caching:** Recommendations are computed once and cached in Supabase for 12 hours, ensuring sub-100ms load times on subsequent visits.
*   **Auto-Invalidation:** Changing preferences instantly regenerates recommendations.
*   **Rich Metadata:** View detailed synopses, studio info, authors, and popularity rankings directly in the card.
*   **Mobile Optimized:** Fully responsive design with touch-friendly interactions (min 44px targets).

### 🛠 Production-Ready
*   **Secure:** Row Level Security (RLS) protects user data.
*   **Robust:** Error boundaries and graceful fallbacks for API limits.
*   **Progressive:** Skeleton loaders and smooth UI transitions.

## 🛠 Tech Stack

*   **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) + CSS Modules
*   **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
*   **Authentication:** MyAnimeList OAuth 2.0
*   **Deployment:** Vercel

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Joeliazeers/MAL-Recommender.git
    cd MAL-Recommender
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    VITE_MAL_CLIENT_ID=your_mal_client_id
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_APP_URL=http://localhost:5173
    ```

4.  **Database Setup (Supabase)**
    Run the SQL migrations located in `supabase/migrations/` in your Supabase SQL Editor to set up tables (`user_preferences`, `user_feedback`, `recommendation_cache`, etc.) and security policies.

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 🔒 Security

*   **RLS Policies:** User preferences and cache are strictly private.
*   **Secure Functions:** Database functions use explicit search paths to prevent local file inclusion/schema hijacking.
*   **Token Handling:** OAuth tokens are managed securely via Supabase and local storage with auto-refresh.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).