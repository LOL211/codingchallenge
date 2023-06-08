# Use the latest version of Node.js
FROM node:latest
ENV PORT "8080"
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Start the app
CMD [ "node", "main.js" ]