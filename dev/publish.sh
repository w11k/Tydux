#! /bin/bash

#cd `dirname $0`/..
#
#cd projects/w11k/tydux
#PACKAGE_VERSION=v$(cat package.json  | grep version  | head -1  | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
#cd ../../..
#
#git checkout master && \
#git fetch && \
#git merge origin/master && \
#rm -rf node_modules && \
#rm -rf dist && \
#rm package-lock.json && \
#npm install && \
#npm run build:lib  && \
#npm run test:all && \
#git tag ${PACKAGE_VERSION} && \
#git add . && \
#git commit -m "deployed version ${PACKAGE_VERSION}" && \
#git push && \
#git push --tags && \
#cd dist/w11k/tydux && \
#npm publish --access public && \
#cd ../../..
