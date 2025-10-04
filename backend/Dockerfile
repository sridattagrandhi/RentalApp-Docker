# Use the official lightweight Node.js image.
# https://hub.docker.com/_/node
FROM node:20-slim AS base

# Create and set the working directory inside the container.
WORKDIR /usr/src/app

# Copy the package definition files first. Doing this separately
# allows the Docker cache to preserve the layer containing the
# installed dependencies as long as package.json and package-lock.json
# have not changed, which can significantly speed up subsequent builds.
COPY package*.json ./

# Install production dependencies. Installing all dependencies (not
# just production) is necessary here because the build step below
# relies on TypeScript and other devDependencies. Once Cloud Build
# completes the build, only compiled JavaScript will be used at run
# time.
RUN npm install

# Copy the rest of the backend source code into the image.
COPY . .

# Compile TypeScript sources into JavaScript. The compiled files
# will be emitted into the `dist` directory according to the
# compilerOptions.outDir setting in tsconfig.json.
RUN npm run build

# Expose the port the app listens on. The value comes from the
# `PORT` environment variable if provided but defaults to 8080.
EXPOSE 8080

# Start the service. Using `npm start` picks up the command defined
# in package.json and ensures any Node options are respected.
# When running in Cloud Run the environment variable `PORT` is set
# automatically, which is used by server.ts.
CMD ["npm", "start"]