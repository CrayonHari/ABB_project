# Stage 1: Build the Angular application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
# Copy the built app from the correct sub-directory
COPY --from=build /app/dist/frontend/browser/ /usr/share/nginx/html
# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80