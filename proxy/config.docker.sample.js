module.exports = {
    "domain": 'localhost:8000',
    "port": 80,
    "botUserAgents": process.env.PROXY_BOT_USER_AGENTS ? process.env.PROXY_BOT_USER_AGENTS.split(',') : [];
}