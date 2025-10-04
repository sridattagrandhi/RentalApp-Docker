module.exports = {
  // Return an empty object if Jest is running to prevent Babel from interfering
  // with ts-jest's transformation of TypeScript files
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
};