#!/bin/bash
npm install
npm run build
cd build
npm ci --omit='dev'
cp ../.env .

sudo node bin/server.js