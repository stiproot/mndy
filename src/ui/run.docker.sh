#!/bin/sh

rm -r ./dist/
npm run build
cp .env ./dist/

docker build -f Dockerfile -t img-mndy-ui-$1 .

docker run --name mndy-ui-$1 \
    -p 8080:8081 \
    -it --detach \
    img-mndy-ui-$1

# docker exec -it mndy-ui-$1 sh
