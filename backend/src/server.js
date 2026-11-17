const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const chatRoutes = require('./routes/chat');
const { HttpError, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new HttpError(403, 'Origin is not allowed by CORS.'));
  },
}));
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'badr-support-backend',
  });
});

app.use('/api/chat', chatRoutes);
app.use((req, res, next) => {
  next(new HttpError(404, 'Route not found.'));
});
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`BADR_SUPPORT backend listening on port ${config.port}`);
});
