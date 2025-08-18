FROM node:18

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install
COPY . .
RUN cp src/config/config.docker.sample.ts src/config/config.ts
RUN npm run build

ENV PORT=80

CMD ["bash", "entrypoint.sh"]
