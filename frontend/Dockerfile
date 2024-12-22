# Use an official Node.js image as the base
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Copy the tarballs to the container
COPY ./tarballs /app/tarballs

# Install dependencies from tarballs
RUN npm install ./tarballs/*.tgz

# Install serve from its tarball
RUN npm install -g ./tarballs/serve-*.tgz

# Copy the rest of the application code
COPY . .

# Build the React app for production
RUN npm run build

# Use a lightweight server to serve the static files
CMD ["serve", "-s", "build"]

# Expose the port the app runs on
EXPOSE 3000
