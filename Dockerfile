# Builder stage.
FROM node:lts-bullseye-slim as builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY ./src ./src

# Install bundle for building and generate build
RUN npm ci --quiet && npm install typescript -g && npm run build

# Production stage.
FROM builder as production

WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./

# Install deb packages for whatsapp-web.js
RUN apt-get update && apt-get install -y gconf-service libgbm-dev libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# RUN ci for production omitting dev dependencies
RUN npm ci --quiet --omit=dev

# Get back bundle app to compile
COPY --from=builder app/dist ./dist

EXPOSE 8080

CMD [ "npm", "run", "start" ]