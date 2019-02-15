const esModules = ['[thir-party-lib]'].join('|');

module.exports = {
  globals: {
    "ts-jest": {
      "allowSyntheticDefaultImports": true
    }
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  moduleNameMapper: {
    "@w11k/tydux": "<rootDir>/dist/w11k/tydux",
    "@w11k/tydux-angular": "<rootDir>/dist/w11k/tydux-angular",
  },

  "transform": {
    "^.+\\.js$": "babel-jest"
  }
};
