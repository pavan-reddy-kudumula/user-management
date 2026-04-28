require('dotenv').config();

const { createApp } = require('./app');
const { connectDatabase } = require('./config/database');

async function bootstrap() {
  const port = Number(process.env.PORT || 3000);
  const app = createApp();

  await connectDatabase();

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});