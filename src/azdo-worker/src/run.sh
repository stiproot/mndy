dapr run \
    --app-id mndy-azdo-worker \
    --app-port 6003 \
    --placement-host-address localhost:50005 \
    --resources-path ../../dapr/components.localhost/ \
    --config ../../dapr/configuration/config.yaml \
    -- python3 -m uvicorn main:app --host 0.0.0.0 --port 6003
