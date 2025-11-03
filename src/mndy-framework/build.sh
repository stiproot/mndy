#!/bin/bash

rm -rf dist/

uv build

# python3 -m build

cd dist/

tar -xvf *.tar.gz -C .
