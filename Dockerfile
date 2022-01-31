
# syntax=docker/dockerfile:1
FROM node:16-alpine
RUN apk update && apk add --no-cache chromium 
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
ENV PATH /app/node_modules/.bin:$PATH
COPY . .
RUN mkdir -p /app/screenshots
EXPOSE 80 443
CMD ["node", "./index.js"]
