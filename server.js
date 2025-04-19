const express = require('express');
const cors = require('cors');
const routes = require('./app/routes/index');

const ColorRoutes = require('./app/routes/color.route')
const SizeRoutes = require('./app/routes/size.route')

const logger = require('./app/utils/logger');
const dotenv = require('dotenv');

const app = express();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}. Reason: ${reason} at - : ${new Date()}`);
    logger.error(reason.stack);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception at - : ${new Date()} message - : ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    try {
        logger.error(`Caught global error at - : ${new Date()} message - ${err.message}`);
        logger.error(err.stack);
        res.status(500).send('Internal Server Error');
    } catch (error) {
        console.error(`Error writing to file: ${error.message}`);
    }
});


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
    origin: ['http://localhost:49178']
}));
dotenv.config();
app.use(express.json());

app.get('/healthCheck', (req, res) => {
    const healthCheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now()
    };
  
    try {
      res.send(healthCheck);
    } catch (error) {
      healthCheck.message = error;
      res.status(503).send();
    }
  });

// Use routes with common prefix
app.use('/pdc/api/v1', routes, ColorRoutes, SizeRoutes);

const port = process.env.PORT || 49180;
app.listen(port, () => {
    logger.info(`Your app is listening on port ${port}`);
});
