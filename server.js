const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      'https://civiclens-ochre.vercel.app',
      'http://localhost:5173',
    ];
    if (!origin || allowed.includes(origin) || origin.includes('parakhsingh05s-projects.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'backend/uploads')));

app.use('/api/auth', require('./backend/routes/auth.routes'));
app.use('/api/issues', require('./backend/routes/issue.routes'));
app.use('/api/admin', require('./backend/routes/admin.routes'));
app.use('/api/alerts', require('./backend/routes/alert.routes'));
app.use('/api/upload', require('./backend/routes/upload.routes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CivicLens API is running' });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, '0.0.0.0', () => {
      console.log('Server running on port ' + PORT);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
