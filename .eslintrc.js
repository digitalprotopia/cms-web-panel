module.exports = {
  ignorePatterns: ['node_modules/*', '.next/*', 'out/*', 'mock-server/*'],
  extends: ['airbnb', 'eslint:recommended', 'next'],
  rules: {
    'react/jsx-filename-extension': 'off',
    'linebreak-style': 'off',
    'no-console': 'off',
    'react/destructuring-assignment': 'off',
    'react/no-array-index-key': 'off',
    'no-alert': 'off',
    'react/jsx-props-no-spreading': 'off',
    '@next/next/no-page-custom-font': 'off',
    'no-plusplus': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/control-has-associated-label': 'off',
    'import/extensions': 'off',
  },
};
