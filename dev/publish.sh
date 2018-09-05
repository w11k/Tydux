#! /bin/bash

cd `dirname $0`
cd ..

PACKAGE_VERSION=v$(cat package.json  | grep version  | head -1  | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')

git checkout master && \
git fetch && \
git merge origin/master && \
npm run test && \
npm run dist && \
git tag ${PACKAGE_VERSION} && \
npm publish --access public && \
git push && \
git push --tags && \
npm --no-git-tag-version version patch && \
git add . && \
git commit -m "started new version" && \
git push
