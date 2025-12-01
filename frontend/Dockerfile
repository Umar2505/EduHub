FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose Vite default port
EXPOSE 5173

# Run Vite in dev mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
