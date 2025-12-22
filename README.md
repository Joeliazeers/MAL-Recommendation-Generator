# MAL Recommender
A highly personalized anime and manga recommendation system powered by **MyAnimeList** and **Supabase**. This application goes beyond simple suggestions by combining **content-based filtering** with **collaborative filtering** to provide accurate, tailored recommendations based on your unique watch history and preferences.

## 🚀 Key Features

### 🧠 Recommendation Engine
*   **Hybrid Algorithm:** Combines 70% Content-Based (genres, studios, authors) and 30% Collaborative Filtering (user similarity) for diverse and relevant results.
*   **Preferences System:** Customize your feed by selecting favorite genres, excluding dislikes, and setting minimum score thresholds.
*   **Smart Filtering:** Automatically excludes "Plan to Watch", "Dropped", and "Completed" entries to show you only fresh content.
*   **Similar User Matching:** Finds users with similar taste profiles (Jaccard similarity) to surface hidden gems.

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
    
## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
