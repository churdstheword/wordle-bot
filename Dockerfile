FROM node:16-alpine
RUN apk update && apk add --no-cache chromium 
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
WORKDIR /app
ENV PATH ./node_modules/.bin:$PATH
USER node
COPY package*.json ./
RUN npm install --silent
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
