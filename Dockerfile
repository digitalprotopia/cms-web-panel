FROM node:18

WORKDIR /app

COPY package.json package.json
RUN npm install
COPY . .
RUN cp config/config.docker.sample.ts config/config.ts
RUN npm run build

ENV PORT=80

CMD ["npm", "run", "start"]
