podman-compose -p mndy -f docker-compose.yml -f docker-compose.arm.override.yml --env-file .core.env up --build

dapr init --container-runtime podman

python -m ensurepip --upgrade
