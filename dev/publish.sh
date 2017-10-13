#! /bin/bash

cd `dirname $0`
cd ..

git add .

#PACKAGE_VERSION=$(cat package.json  | grep version  | head -1  | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')


npm run dist && npm run test && npm publish --access public
npm version patch
git push
git push --tags

