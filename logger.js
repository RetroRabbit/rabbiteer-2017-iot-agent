const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, colorize } = format;
const { LEVEL, MESSAGE } = require('triple-beam');
const { Console } = transports;
const TransportStream = require('winston-transport');

class MyLogger extends TransportStream {

    get name() { return "mylogger"; }

    log(info, callback) {
        console.log(`${info.level}: ${info.message}`)
        callback();
    }
}

module.exports = (loglevel) => createLogger({
    level: loglevel,
    format: combine(printf(info => {
        return info.message;
    }), colorize({ all: true })),
    transports: [new MyLogger()]
});
