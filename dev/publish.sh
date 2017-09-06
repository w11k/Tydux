#! /bin/bash

cd `dirname $0`
cd ..

git add .
git commit -m "new release"
npm run dist && npm run test && npm publish --access public
npm version patch
git push
