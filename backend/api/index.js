// Vercel serverless entry point
// This file is used by Vercel to handle the backend service
// as a serverless function. Requests to /_/backend/* are routed here.
const app = require('../app');

module.exports = app;