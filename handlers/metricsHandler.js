
class MetricsHandler {
    constructor(options, mqtt, influx, logger) {
        this._influx = influx;
        this._mqtt = mqtt;
        this._logger = logger;
        this._running = true;
    }

    get pattern() { return /^metric\/([^/]+)\/([^/]+)$/; }

    async message(topic, payload, packet) {

        const metric = topic[1];
        const name = topic[2];
        const value = parseFloat(packet.payload);
        if (!isNaN(value) && isFinite(value)) {
            this._logger.debug(`got metric: ${metric}/${name} -> ${value}`);
            await this._influx.writePoints([{
                measurement: metric,
                tags: { name },
                fields: { value }
            }]);
        }

    }

    stop() { this._running = false; }
}

module.exports = { MetricsHandler };