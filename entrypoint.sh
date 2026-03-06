cd /app/proxy
node chrome.js &
cd /app
node docker.js
npm run start -- --port 8000