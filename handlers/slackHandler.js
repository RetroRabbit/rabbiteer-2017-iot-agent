const slack = require('slack');
const _ = require('lodash');


class SlackHandler {

    constructor(options, mqtt, influx, logger) {
        this._token = options.slackToken;
        this._influx = influx;
        this._mqtt = mqtt;
        this._logger = logger;
        this._running = true;
    }

    get pattern() { return /^slack\/([a-z0-9-]{3,21})$/; }

    async message(topic, payload, packet) {

        if (!this._running) return;

        const token = this._token;
        if (token) {

            const getChannels = async () => {
                const channels = {};
                let cursor;
                for (; ;) {
                    const response = await slack.channels.list({ token, exclude_members: true, cursor });
                    if (!response.ok) {
                        this._logger.error(`Failed to get channel list ${repsonse}`);
                        break;
                    } else {

                        if (response.channels) {
                            response.channels.forEach(channel => {
                                channels[channel.name] = channel;
                            });
                        }

                        cursor = response.response_metadata && response.response_metadata.next_cursor;
                        if (!cursor || !response.channels || !response.channels.length) {
                            break;
                        }
                    }
                }

                this._logger.verbose(`got channels: ${_.keys(channels)}`);
                return channels;
            };

            const channel = topic[1];

            this._logger.verbose(`Sending slack message to channel #${channel}.`);
            this._logger.verbose(`slack message for #${channel}: ${payload}`);

            if (!this._channels || (!channel in this._channels)) {
                this._channels = await getChannels();
            }

            const channel_info = this._channels[channel];
            if (!channel_info) {
                this._logger.info(`Not sending message to nonexistent channel ${channel}`);
            } else {
                const channel_id = channel_info.id;
                const text = payload.toString();
                this._logger.verbose(`Sending ${text} to channel ${channel} (${channel_id})`);
                await slack.chat.postMessage({ token, channel: channel_id, text });
            }
        }
    }

    stop() { this._running = false; }
}

module.exports = { SlackHandler };