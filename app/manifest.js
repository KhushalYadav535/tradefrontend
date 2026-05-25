export default function manifest() {
  return {
    name: 'Virtual Trading',
    short_name: 'Trading',
    description: 'Virtual Trading Platform — Trade NIFTY, BANKNIFTY & more',
    start_url: '/watchlist',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b0e14',
    theme_color: '#0b0e14',
    categories: ['finance', 'trading'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };
}
