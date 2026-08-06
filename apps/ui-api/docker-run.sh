#!/bin/sh

docker build -f Dockerfile -t img-mndy-ui-api-$1 .
docker run --name mndy-ui-api-$1 -p 3001:3002 -it --detach img-mndy-ui-api-$1
docker exec -it mndy-ui-api-$1 sh
