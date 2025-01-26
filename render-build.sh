#!/usr/bin/env bash

# Update package list
apt-get update

# Install Poppler for `pdf-poppler` and `pdf2image`
apt-get install -y poppler-utils

# Install libvips for `sharp`
apt-get install -y libvips-dev

# Install build tools
apt-get install -y build-essential

# Optional: Clean up
apt-get clean
