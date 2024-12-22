#!/bin/bash

# Ensure all dependencies are installed
npm install

# Check if the tarballs directory exists, if not, create it
if [ ! -d "tarballs" ]; then
  echo "Creating tarballs directory..."
  mkdir tarballs
fi

# Create tarballs for each package in node_modules
for package in $(jq -r '.dependencies | keys[]' package.json); do
  echo "Packing $package..."
  npm pack $package
  mv *.tgz tarballs/
done

# Pack the 'serve' package and move it to tarballs directory
echo "Packing serve..."
npm pack serve
mv serve-*.tgz tarballs/

echo "All tasks completed!"
