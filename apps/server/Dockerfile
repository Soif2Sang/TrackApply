# Use an official Node.js runtime as a parent image
FROM node:23

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
RUN npm install

# Copy the rest of the application's code
COPY . .

ARG BETTER_AUTH_SECRET
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ARG CORS_ORIGIN
ENV CORS_ORIGIN=$CORS_ORIGIN
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Build the application
RUN npm run build

# Make port 3002 available to the world outside this container
EXPOSE 3002

# Define environment variable
ENV PORT 3002

# Run the app when the container launches
CMD [ "npm", "start" ]
