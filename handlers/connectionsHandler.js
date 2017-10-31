const RabbitMqApiConnection = require('./rabbitmq-api').RabbitMqApiConnection;
const _ = require('lodash');

class ConnectionHandler {
    constructor(options, mqtt, influx, logger) {
        const rabbitmq = new RabbitMqApiConnection({
            url: options.rabbitmqUrl,
            username: options.rabbitmqUsername,
            password: options.rabbitmqPassword,
            logger: logger
        });

        this._interval = setInterval(() => {
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
    
                    logger.silly(`writing connections: ${JSON.stringify(connections)}`);
                    influx.writePoints(messages).catch(console.error);
                });
        }, 5000);
    }

    get pattern() { return null; }

    message(topic, payload, packet) {}

    stop() { clearInterval(this._interval); }
}

module.exports = { ConnectionHandler };