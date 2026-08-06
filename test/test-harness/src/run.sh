#!/bin/sh

dapr run --app-id mndy-test-harness \
    --placement-host-address localhost:50000 \
    --resources-path ../../config/dapr/components.localhost/ \
    --config ../../config/dapr/configuration/config.yaml \
    --app-port 6010 \
    -- python3 -m uvicorn main:app --host 0.0.0.0 --port 6010