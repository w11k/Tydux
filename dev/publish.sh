#! /bin/bash

cd `dirname $0`
cd ..

PACKAGE_VERSION=v$(cat package.json  | grep version  | head -1  | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')

npm run dist && \
npm run test && \
git tag ${PACKAGE_VERSION} \
npm publish --access public && \
git push && \
git push --tags \
npm --no-git-tag-version version patch && \
git push
