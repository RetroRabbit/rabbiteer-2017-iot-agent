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

function getNew(_old, _new) {
    const newKeys = _.reject(_.keys(_new), k => _.has(_old, k));
    const result = {};
    _.forEach(newKeys, k => result[k] = _new[k]);
    return result;
}

async function main() {

    setInterval(() => {
        rabbitmq.getConnections()
            .then(connectionlist => {
                const connections = _(connectionlist)
                    .groupBy(x => x.user)
                    .mapValues(k => k.length)
                    .value();

                const messages = _(connections)
                    .map((connections, name) => ({
                        measurement: 'connections',
                        tags: { name },
                        fields: { connections }
                    }))
                    .concat({
                        measurement: 'connections',
                        tags: { name: 'total' },
                        fields: { connections: _(connections).map(v => v).sum() }
                    })
                    .value();

                influxdb.writePoints(messages).catch(console.error);
            });
    }, 5000);

    // var client = await new Promise((resolve, reject) => {
    //     const client = mqtt.connect('mqtt://test.mosquitto.org');
    //     client.on('error', reject);
    //     client.on('connect', resolve);
    // });

    // client.subscribe('presence')
    // client.publish('presence', 'Hello mqtt')

    // client.on('message', function (topic, message) {
    //     // message is Buffer
    //     console.log(message.toString())
    //     client.end()
    // })


    // fired when a client connects
    // server.on('clientConnected', function (client) {
    //     influxdb.writePoints([{
    //         measurement: 'devices',
    //         tags: { name: client.id },
    //         fields: { connected: 1, total: Object.keys(server.clients).length }
    //     }]).catch(console.error);
    //     console.log('Client Connected:', client.id);
    // });

    // fired when a client disconnects
    // server.on('clientDisconnected', function (client) {
    //     influxdb.writePoints([{
    //         measurement: 'devices',
    //         tags: { name: client.id },
    //         fields: { connected: 0, total: Object.keys(server.clients).length }
    //     }]).catch(console.error);
    //     console.log('Client Disconnected:', client.id);
    // });

    // server.on('published', function (packet, client) {
    //     // <metric>/<name>
    //     var metricmatch = packet.topic.match(/^([^/]+)\/([^/]+)$/);
    //     if(metricmatch) {
    //         const metric = metricmatch[1];
    //         const name = metricmatch[2];
    //         const value = parseFloat(packet.payload);
    //         if(!isNaN(value) && isFinite(value)) {
    //             influxdb.writePoints([{
    //                 measurement: metric,
    //                 tags: { name, client: client.id },
    //                 fields: { value }
    //             }]).catch(console.error);
    //         }
    //     }
    // });
}

main().catch(console.error);