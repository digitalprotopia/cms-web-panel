module.exports = {
  content: ['./pages/**/*.js', './components/*.js'],
  important: '#__next',
  theme: {
    extend: {
      colors: {
        primary: '#f79244',
        secondary: '#dae5f4',
        tertiary: '#687B98',
      },
    },
  },
  // corePlugins: {
  //   preflight: false,
  // },
  plugins: [],
};
