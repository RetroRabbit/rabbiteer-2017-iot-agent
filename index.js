const mqtt = require('mqtt');
const influx = require('influx');
const RabbitMqApiConnection = require('./rabbitmq-api').RabbitMqApiConnection;
const _ = require('lodash');
const program = require('commander');
const package = require('./package.json');

const rxHostPort = /^([^\s:]+)(?::(\d+))?$/;

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
    .parse(process.argv);

const influxhostport = program.influxdb.match(rxHostPort);

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
};

console.log('Configuration:')
Object.keys(options).forEach(k => {
    if(/[pP]assword/.test(k)) {
        console.log(`${k}: ********`);
    } else {
        console.log(`${k}: ${options[k] || ''}`);
    }
});
console.log();

const influxdb = new influx.InfluxDB({
    host: options.influxdbHost,
    port: options.influxdbPort,
    database: options.influxdbDatabase,
    username: options.influxdbUsername,
    password: options.influxdbPassword
});

const client = mqtt.connect(options.mqtt, {
    clientId: 'agent',
    username: options.mqttUsername,
    password: options.mqttPassword
});

client.on('connected', () => console.log('connected'));

client.on('error', e => console.error(e));

client.on('message', (topic, payload, packet) => {
    // <metric>/<name>
    var metricmatch = packet.topic.match(/^([^/]+)\/([^/]+)$/);
    if (metricmatch) {
        const metric = metricmatch[1];
        const name = metricmatch[2];
        const value = parseFloat(packet.payload);
        if (!isNaN(value) && isFinite(value)) {
            influxdb.writePoints([{
                measurement: metric,
                tags: { name, client: client.id },
                fields: { value }
            }]).catch(console.error);
        }
    }
});

client.subscribe('#');

