
class MetricsHandler {
    constructor(options, mqtt, influx) {
        this._influx = influx;
        this._mqtt = mqtt;
    }

    get pattern() { return /^metric\/([^/]+)\/([^/]+)$/; }

    message(topic, payload, packet) {

        const metric = metricmatch[1];
        const name = metricmatch[2];
        const value = parseFloat(packet.payload);
        if (!isNaN(value) && isFinite(value)) {
            this._influx.writePoints([{
                measurement: metric,
                tags: { name },
                fields: { value }
            }]).catch(console.error);
        }

    }

    stop() { }
}

module.exports = { MetricsHandler };