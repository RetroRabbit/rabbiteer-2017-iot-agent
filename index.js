const mqtt = require('mqtt');
const influx = require('influx');
const _ = require('lodash');
const program = require('commander');
const package = require('./package.json');
const createlogger = require('./logger');
const SlackEventListener = require('./slackEventListener');

const handlerClasses = require('./handlers');

const rxHostPort = /^([^\s:]+)(?::(\d+))?$/;

process.on('unhandledRejection', (reason, p) => {
    console.error(`Unhandled Rejection at: Promise ${p} reason: ${reason} stack:\n ${reason.stack}`);
    process.exit(-1);
});

program
    .version(package.version)
    .option('-m, --mqtt [url]', 'The MQTT url. Defaults to mqtt://localhost', 'mqtt://localhost')
    .option('-u, --username [username]', 'the MQTT username')
    .option('-p, --password [password]', 'the MQTT password')
    .option('-i, --influxdb [hostport]', 'The InfluxDB host and port. Defaults to localhost:8086', rxHostPort, 'localhost:8086')
    .option('-d, --influxdb-database [database]', 'The InfluxDB database. Defaults to rabbiteer', 'rabbiteer')
    .option('--influxdb-username [username]', 'The InfluxDB username. Defaults to the MQTT username')
    .option('--influxdb-password [password]', 'The InfluxDB password. Defaults to the MQTT password')
    .option('-r, --rabbitmq [url]', 'The RabbitMQ management interface url. Defaults to http://localhost:15672/', 'http://localhost:15672/')
    .option('--rabbitmq-username [username]', 'The RabbitMQ username. Defaults to the MQTT username')
    .option('--rabbitmq-password [password]', 'The RabbitMQ password. Defaults to the MQTT password')
    .option('--slack-token [token]', 'A token for accessing the slack API')
    .option('--slack-verification-token [token]', 'A token for verifying the requests for the events API')
    .option('--event-port [port]', 'The port on which to listen for HTTP events. Defaults to $PORT or 5295', process.env.PORT || 5295)
    .option('--loglevel [level]', 'The minimum log level. Same as npm log levels. Default is info.', 'info')
    .parse(process.argv);

const influxhostport = program.influxdb.match(rxHostPort);

const logger = createlogger(program.loglevel);

const options = {
    mqtt: program.mqtt,
    mqttUsername: program.username,
    mqttPassword: program.password,
    influxdbHost: influxhostport[1],
    influxdbPort: parseInt(influxhostport[2]),
    influxdbDatabase: program.influxdbDatabase,
    influxdbUsername: program.influxdbUsername || program.username,
    influxdbPassword: program.influxdbPassword || program.password,
    rabbitmqUrl: program.rabbitmq,
    rabbitmqUsername: program.rabbitmqUsername || program.username,
    rabbitmqPassword: program.rabbitmqPassword || program.password,
    eventPort: program.eventPort,
    slackToken: program.slackToken,
    slackVerificationToken: program.slackVerificationToken
};

logger.verbose('Configuration:')
Object.keys(options).forEach(k => {
    if (/[pP]assword/.test(k)) {
        logger.verbose(`${k}: ********`);
    } else {
        logger.verbose(`${k}: ${options[k] || ''}`);
    }
});

const influxdb = new influx.InfluxDB({
    host: options.influxdbHost,
    port: options.influxdbPort,
    database: options.influxdbDatabase,
    username: options.influxdbUsername,
    password: options.influxdbPassword
});

//slack event listener
const slackListener = new SlackEventListener(options.eventPort, options.slackVerificationToken, logger);
slackListener.listen().catch(e => logger.error(e));

//mqtt client
const client = mqtt.connect(options.mqtt, {
    clientId: 'agent',
    username: options.mqttUsername,
    password: options.mqttPassword
});

client.on('connected', () => logger.info(`connected to ${options.mqtt}`));

client.on('error', e => logger.error(e));

const handlers = handlerClasses.map(
    handler => new handler(options, client, influxdb, logger));

logger.info(`Registered handlers: ${_.values(handlers).map(x=>x.constructor.name)}`);

client.on('message', (topic, payload, packet) => {

    (async () => {

        logger.debug(`Received message on ${topic}`);
        logger.silly(`Message: ${payload}`);
    
        const promises = handlers.map(async x => {
            if (x.pattern) {
                let match;
    
                logger.debug(`Testing ${topic} with ${x.pattern} for ${x.constructor.name}`);
                if (_.isRegExp(x.pattern)) {
                    match = topic.match(x.pattern);
                } else if (_.isString(x.pattern)) {
                    match = topic.match(new RegExp(x.pattern));
                } else if (_.isArray(x.pattern)) {
                    match = _(x.pattern)
                        .filter(p => topic.match(_.isRegExp(p) ? p : new RegExp(p)))
                        .first();
                }
    
                if (match) {
                    logger.debug(`Testing ${topic} matched ${x.pattern}`);
                    await x.message(match, payload, packet);
                } else {
                    logger.debug(`Testing ${topic} did not match ${x.pattern}`);
                }
            }
    
        });

        await Promise.all(promises);
    })().catch(e => {
        logger.error(`message handling error: ${e}`);
    });


});

logger.info("Subscribing to #")
client.subscribe('#', e => {
    if (e) {
        logger.verbose(`error subscribing: ${e}`);
    }
    else {
        logger.debug('subscribed to #');
    }

});

