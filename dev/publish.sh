#! /bin/bash

cd `dirname $0`
cd ..

git add .


npm run dist && \
npm run test && \
npm version patch && \
npm publish --access public && \
git push && \
git push --tags
