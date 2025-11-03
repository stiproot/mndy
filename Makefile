docker-compose:
	docker compose -p mndy -f src/docker-compose.yml up --build

docker-compose-arm:
	podman-compose -p mndy -f src/docker-compose.yml -f src/docker-compose.arm.override.yml --env-file .core.env up --build

build-ui:
	npm --prefix src/ui run build

serve-ui:
	npm --prefix src/ui run serve

build-ui-api:
	npm --prefix src/ui-api run build

run-ui-api:
	dapr run --app-id mndy-ui-api \
		--placement-host-address localhost:50000 \
		--config src/dapr/configuration/config.yaml \
		--resources-path src/dapr/components.local/ \
		--dapr-http-port 3500 \
		--app-port 3001 \
		-- npm --prefix src/ui-api run start

run-azdoproxy-worker:
	cd src/azdoproxy-worker/src && \
	dapr run --app-id mndy-azdoproxy-worker \
		--placement-host-address localhost:50000 \
		--resources-path ../../dapr/components.local/ \
		--config ../../dapr/configuration/config.yaml \
		--app-port 6006 \
		-- python3 -m uvicorn main:app --host 0.0.0.0 --port 6006

run-azdo-worker:
	cd src/azdo-worker/src && \
	dapr run --app-id mndy-azdo-worker \
		--placement-host-address localhost:50000 \
		--resources-path ../../dapr/components.local/ \
		--config ../../dapr/configuration/config.yaml \
		--app-port 6006 \
		-- python3 -m uvicorn main:app --host 0.0.0.0 --port 6006

run-insights-worker:
	cd src/insights-worker/src && \
	dapr run --app-id mndy-insights-worker \
		--placement-host-address localhost:50000 \
		--resources-path ../../dapr/components.local/ \
		--config ../../dapr/configuration/config.yaml \
		--app-port 6006 \
		-- python3 -m uvicorn main:app --host 0.0.0.0 --port 6006

run-workflows-worker:
	cd src/workflows-worker/src && \
	dapr run --app-id mndy-workflows-worker \
		--placement-host-address localhost:50000 \
		--resources-path ../../dapr/components.local/ \
		--config ../../dapr/configuration/config.yaml \
		--app-port 6006 \
		-- python3 -m uvicorn main:app --host 0.0.0.0 --port 6006

build-framework-pkg:
	rm -rf src/modules/mndy-framework/dist
	python3.12 -m build src/modules/mndy-framework
	tar -xvf src/modules/mndy-framework/dist/*.tar.gz -C src/modules/mndy-framework/dist/

install-framework-pkg:
	python3.12 -m pip uninstall mndy-framework -y
	python3.12 -m pip install src/modules/mndy-framework/dist/mndy_framework-0.0.1/.
	cp -f src/modules/mndy-framework/dist/mndy_framework-0.0.1.tar.gz src/azdo-worker/pkg/
	cp -f src/modules/mndy-framework/dist/mndy_framework-0.0.1.tar.gz src/insights-worker/pkg/
	cp -f src/modules/mndy-framework/dist/mndy_framework-0.0.1.tar.gz src/azdoproxy-worker/pkg/
	cp -f src/modules/mndy-framework/dist/mndy_framework-0.0.1.tar.gz src/workflows-worker/pkg/
	cp -f src/modules/mndy-framework/dist/mndy_framework-0.0.1.tar.gz test/test-harness/pkg/
