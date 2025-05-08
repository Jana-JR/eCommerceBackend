const { createClient } = require('redis');

const client = createClient({
  url: 'redis://127.0.0.1:6379'
});

client.on('error', (err) => console.error('Redis Client Error:', err));

(async () => {
  await client.connect();
  const pong = await client.ping();
  console.log('Ping response:', pong);
  await client.quit();
})();
