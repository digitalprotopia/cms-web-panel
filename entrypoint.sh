cd /app/proxy
npm start &
cd /app
node docker.js
npm run start -- --port 8000