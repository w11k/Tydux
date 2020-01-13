

rm -rf node_modules
npm i

npm run build:lib
npm publish dist/w11k/tydux
npm publish dist/w11k/tydux-angular
