
# syntax=docker/dockerfile:1
FROM node:16-alpine
RUN apk update && apk add --no-cache chromium 
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
USER node
ENV PATH /app/node_modules/.bin:$PATH
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
