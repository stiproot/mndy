#!/bin/bash

python -m pip uninstall mndy-framework
# python3.12 -m pip uninstall mndy-framework

python -m pip install dist/mndy_framework-0.1.0/.
# python3.12 -m pip install dist/mndy_framework-0.1.0/.

cp -f dist/mndy_framework-0.1.0.tar.gz ~/code/azdo/mndyetrics/src/azdo-worker/pkg/
cp -f dist/mndy_framework-0.1.0.tar.gz ~/code/azdo/mndyetrics/src/insights-worker/pkg/
cp -f dist/mndy_framework-0.1.0.tar.gz ~/code/azdo/mndyetrics/src/azdoproxy-worker/pkg/
cp -f dist/mndy_framework-0.1.0.tar.gz ~/code/azdo/mndyetrics/src/workflows-worker/pkg/
cp -f dist/mndy_framework-0.1.0.tar.gz ~/code/azdo/mndyetrics/test/test-harness/pkg/
