const esModules = ['[thir-party-lib]'].join('|');

module.exports = {
  globals: {
    "ts-jest": {
      "allowSyntheticDefaultImports": true
    }
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  moduleNameMapper: {
    "^@w11k/(.*)$": "<rootDir>/dist/w11k/$1"
  },

  "transform": {
    "^.+\\.js$": "babel-jest"
  }
};
