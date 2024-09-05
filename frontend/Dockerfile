# Use an official Node.js image as the base
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm install

# Install additional dependencies (if not already included in package.json)
RUN npm install file-saver

# Copy the rest of the application code
COPY . .

# Build the React app for production
RUN npm run build

# Use a lightweight server to serve the static files
# Alternatively, you can use the default build output to serve the app with a different server.
RUN npm install -g serve
CMD ["serve", "-s", "build"]

# Expose the port the app runs on
EXPOSE 3000