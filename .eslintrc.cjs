module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react', 'react-hooks', 'react-refresh'],
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'gangnamon/',
    'native-app/',
    'functions/',
    '.vercel/',
    'vite.config.js.timestamp-*',
  ],
  rules: {},
};
