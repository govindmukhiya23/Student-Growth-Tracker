/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['import', 'boundaries'],
  extends: ['eslint:recommended', 'plugin:import/recommended'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx'],
      },
    },
    'boundaries/elements': [
      { type: 'core',    pattern: 'server/src/core/**' },
      { type: 'feature', pattern: 'server/src/features/*/**' },
      { type: 'shared',  pattern: 'shared/src/**' },
      { type: 'client-core',    pattern: 'client/src/core/**' },
      { type: 'client-feature', pattern: 'client/src/features/*/**' },
    ],
  },
  rules: {
    // ── import boundary rules ─────────────────────────────────────────────
    // features must not import each other's internals
    'boundaries/element-types': [
      'error',
      {
        default: 'allow',
        rules: [
          // server features → only core and shared are allowed
          {
            from: 'feature',
            disallow: ['feature'],
            message: 'Features must not import each other. Use the event bus in core/events.js.',
          },
          // server core → must not import from features
          {
            from: 'core',
            disallow: ['feature'],
            message: 'core/ must not import from features/.',
          },
          // client features → only client-core and shared allowed
          {
            from: 'client-feature',
            disallow: ['client-feature'],
            message: 'Client features must not import each other. Register through the feature registry.',
          },
          {
            from: 'client-core',
            disallow: ['client-feature'],
            message: 'client/src/core must not import from features/.',
          },
        ],
      },
    ],
    // ── general rules ─────────────────────────────────────────────────────
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    eqeqeq: 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
  },
  overrides: [
    // client (React / JSX)
    {
      files: ['client/src/**/*.{js,jsx}'],
      env: { browser: true, node: false },
      parserOptions: { ecmaFeatures: { jsx: true } },
      plugins: ['react', 'react-hooks'],
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
      settings: { react: { version: 'detect' } },
      rules: { 'react/react-in-jsx-scope': 'off', 'react/prop-types': 'off' },
    },
    // test files — relax some rules
    {
      files: ['**/*.test.{js,jsx}', '**/__tests__/**'],
      env: { jest: true },
      rules: { 'no-console': 'off' },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'coverage/'],
};
