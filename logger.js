const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, colorize } = format;
const { Console } = transports;


module.exports = createLogger({
    level: 'debug',
    format: combine(printf(info => {
        return `${info.level}: ${info.message}`;
    }),
        colorize({ all: true })),
    transports: [new Console()]
});
