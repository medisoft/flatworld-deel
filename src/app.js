const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)


const contractsRoute = require('./routes/contracts');
const jobsRoute = require('./routes/jobs');
const balancesRoute = require('./routes/balances');
const adminRoute = require('./routes/admin');

app.use('/contracts', contractsRoute);
app.use('/jobs', jobsRoute);
app.use('/balances', balancesRoute);
app.use('/admin', adminRoute);

module.exports = app;
