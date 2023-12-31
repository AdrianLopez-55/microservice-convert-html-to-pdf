FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@9.7.1

RUN npm install

COPY . .

RUN npm run build

RUN apt-get update && apt-get install -yq --fix-missing libgconf-2-4 chromium

# Establecer el argumento "--no-sandbox" al lanzar el navegador Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_ARGS="--no-sandbox"

EXPOSE 4500

CMD [ "npm", "run", "start:prod" ]