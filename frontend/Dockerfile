# --- 1. Build Stage ---
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- 2. Production Stage ---
FROM nginx:alpine

# Copy build output to nginx HTML dir
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
