# MAL Recommender

A personalized anime and manga recommendation app powered by MyAnimeList.

## Features

- **Personalized Recommendations** - Get anime/manga suggestions based on your MAL ratings
- **Discover New Titles** - Find highly-rated series from random seasons you haven't watched
- **Rewatch/Reread** - Rediscover your highest-rated titles worth experiencing again
- **Genre Filtering** - Filter recommendations by multiple genres
- **Quick Add to List** - Add recommendations directly to your MAL "Plan to Watch/Read" list
- **Share Recommendations** - Generate shareable links for friends
- **Daily Cooldown** - New recommendations available at midnight

## Tech Stack

- React + Vite
- Supabase
- MyAnimeList API v2

## Deploy on Vercel

1. Fork this repository
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_MAL_CLIENT_ID`
   - `VITE_MAL_CLIENT_SECRET`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## License

MIT
