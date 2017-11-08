const slack = require('slack');
const _ = require('lodash');
const SlackEventListener = require('./slackEventListener');


class SlackHandler {

    constructor(options, mqtt, influx, logger) {
        this._token = options.slackToken;
        this._influx = influx;
        this._mqtt = mqtt;
        this._logger = logger;
        this._running = true;
        this._ignore = [];

        //slack event listener
        this._slackListener = new SlackEventListener(
            options.eventPort,
            options.slackVerificationToken,
            logger);
        this._slackListener.listen().catch(e => logger.error(e));

        this._slackListener.on('message', async msg => {
            const text = msg.text;
            const channel_id = msg.channel;

            if (text) {

                const getchannelinfo = id => this._channels && _.values(this._channels).filter(c => c.id == id)[0];
                let channel_info = getchannelinfo(channel_id);
                if (!channel_info) {
                    await this._getChannels();
                    channel_info = getchannelinfo(channel_id);
                }

                if (!channel_info) {
                    this._logger.warn(`Could not find channel ${channel_id}`);
                } else {
                    const channel = channel_info.name;
                    const topic = `slack/${channel}`;
                    this._logger.verbose(`Publishing ${text} to mqtt topic slack/${channel}`);
                    
                    const moniker_ix = this._ignore.indexOf(`(slack) ${channel}/${text}`)
                    if(moniker_ix >= 0) {
                        this._ignore.splice(moniker_ix, 1);
                    } else {
                        this._ignore.push(`(mqtt) ${channel}/${text}`);
                        this._mqtt.publish(topic, text);
                    }
                }
            }
        });
    }

    async start() {
        await this._getChannels();
    }

    async _getChannels() {
        const channels = {};
        let cursor;
        for (; ;) {
            const response = await slack.channels.list({ token: this._token, exclude_members: true, cursor });
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

        this._logger.verbose(`got channels: \n${_.toPairs(channels).map(p => `  ${p[0]} (${p[1].id})`).join('\n')}`);

        this._channels = channels;
        return this._channels;
    };

    get pattern() { return /^slack\/([a-z0-9-]{3,21})$/; }

    async message(topic, payload, packet) {

        if (!this._running) return;

        const token = this._token;
        const channel = topic[1];
        if (token && channel) {

            if (!this._channels || (!channel in this._channels)) {
                await this._getChannels();
            }

            const channel_info = this._channels[channel];
            if (!channel_info) {
                this._logger.info(`Not sending message to nonexistent channel ${channel}`);
            } else {
                this._logger.verbose(`Sending slack message to channel #${channel}.`);
                this._logger.verbose(`slack message for #${channel}: ${payload}`);
                const channel_id = channel_info.id;
                const text = payload.toString();
                this._logger.verbose(`Sending ${text} to slack channel ${channel} (${channel_id})`);


                const moniker_ix = this._ignore.indexOf(`(mqtt) ${channel}/${text}`)
                if(moniker_ix >= 0) {
                    this._ignore.splice(moniker_ix, 1);
                } else {
                    this._ignore.push(`(slack) ${channel}/${text}`);
                    await slack.chat.postMessage({ token, channel: channel_id, text });
                }
            }
        }
    }

    stop() { this._running = false; }
}

module.exports = { SlackHandler };