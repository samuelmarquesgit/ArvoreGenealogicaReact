const express = require('express');
const cors = require('cors');
const sheetsRouter = require('./routes/sheets');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/sheets', sheetsRouter);

app.use(errorHandler);

module.exports = app;
