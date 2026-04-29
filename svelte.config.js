import adapter from '@sveltejs/adapter-static';

const config = {
  kit: {
    adapter: adapter({
      fallback: '404.html',
      strict: false,
    }),
    paths: {
      base: process.env.PUBLIC_BASE_PATH
        ? process.env.PUBLIC_BASE_PATH.replace(/\/$/, '')
        : '',
    },
  },
};

export default config;
