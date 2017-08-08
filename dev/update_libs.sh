#! /bin/bash

cd `dirname $0`
cd ..

rm -rf node_modules
rm -rf typings

npm install
./node_modules/.bin/typings install


