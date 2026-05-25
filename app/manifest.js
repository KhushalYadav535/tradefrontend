export default function manifest() {
  return {
    name: 'Virtual Website',
    short_name: 'Virtual',
    description: 'Virtual Website Progressive Web App',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
