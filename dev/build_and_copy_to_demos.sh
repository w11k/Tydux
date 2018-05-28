#! /bin/bash

cd `dirname $0`/..

npm run clean
npm run compile
npm run types

cp -r dist ../tydux-demo-angular/node_modules/@w11k/tydux
cp -r dist ../tydux-demo-angularjs/node_modules/@w11k/tydux
