dapr run --app-id mndy-ui-api \
  --placement-host-address localhost:50005 \
  --config ../dapr/configuration/config.yaml \
  --resources-path ../dapr/components.localhost/ \
  --dapr-http-port 3500 \
  --app-port 3001 \
  -- npm run start
