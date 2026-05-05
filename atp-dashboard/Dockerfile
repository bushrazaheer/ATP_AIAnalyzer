# Stage 1: Build
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Use build-time args for your Cloud Run Backend URL
# // ARG REACT_APP_API_BASE_URL
# // ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

ARG REACT_APP_API_BASE_URL=https://atp-app-580063500531.europe-west1.run.app
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
RUN npm run build

# Stage 2: Production Environment
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
# Include an nginx.conf to handle React routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]