module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: [
    'standard',
    'turbo',
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'only-multiline'],
  },
};
