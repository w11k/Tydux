module.exports = {
  preset: 'jest-preset-angular',
  setupTestFrameworkScriptFile: '<rootDir>/setupJest.ts',
  moduleNameMapper: {
    "@w11k/tydux": "<rootDir>/dist/w11k/tydux",
    "@w11k/tydux-angular": "<rootDir>/dist/w11k/tydux-angular",
  }
};
