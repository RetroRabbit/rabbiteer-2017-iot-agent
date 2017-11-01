var glob = require('glob'), path = require('path');
var _ = require('lodash');

const handlers = [
    './connectionsHandler',
    './metricsHandler',
    './slackHandler'
]

const allHanlderClasses = _(handlers)
    .map(file => require(file))
    .map(exports => _.values(exports))
    .flatMap()
    .value()

module.exports = allHanlderClasses;