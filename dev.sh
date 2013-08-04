#!/bin/sh

NODE_ENV=development nodemon app.js -w lib -w middleware -w routes
