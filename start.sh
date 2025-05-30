#!/bin/bash

set -e

npm install

npm run db:migrate

npm run build


echo "API build complete. Starting the server..."