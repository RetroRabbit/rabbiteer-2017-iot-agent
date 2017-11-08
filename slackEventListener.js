const http = require('http');


module.exports = class SlackEventListener {
    constructor(port, logger) {
        this.port = port;

        if (logger) {
            this._verbose = logger.verbose.bind(logger);
            this._error = logger.error.bind(logger);
            this._warn = logger.warn.bind(logger);
            this._silly = logger.silly.bind(logger);
            this._debug = logger.debug.bind(logger);
            this._info = logger.info.bind(logger);
        } else {
            const f = function () { };
            this._verbose = f;
            this._error = f;
            this._warn = f;
            this._silly = f;
            this._debug = f;
            this._info = f;
        }

        this.server = http.createServer(async (req, res) => {

            const badRequest = () => {
                res.statusCode = 400;
                res.statusMessage = "Bad Request";
                res.end("Bad Request");
            };

            const readRequestBody = () => {
                return new Promise((resolve, reject) => {
                    let data = '';
                    req.on('data', d => data += d);
                    req.once('error', e => reject(e));
                    req.once('end', () => {
                        this._silly(`Got request ${req.method} ${req.url} -> ${data}`);
                        resolve(JSON.parse(data));
                    });
                });
            };

            const json = (wut) => {
                res.setHeader("content-type", "application/json")
                res.statusMessage = "OK";
                res.statusCode = 200;
                res.end(JSON.stringify(wut));
            };

            const text = (wut) => {
                res.setHeader("content-type", "text/plain")
                res.statusMessage = "OK";
                res.statusCode = 200;
                res.end(wut);
            };

            const ok = () => text();


            if (req.headers["content-type"] == "application/json") {
                const requestBody = await readRequestBody();

                if (!requestBody) {
                    badRequest();
                } else {
                    if (requestBody.type) {
                        this._verbose(`Got request ${req.method} ${req.url} with type ${requestBody.type}`);

                        switch (requestBody.type) {
                            case "url_verification":
                                text(requestBody.challenge);
                                break;
                            default:
                                ok();
                                break;
                        }

                    } else {
                        badRequest();
                    }
                }
            } else {
                badRequest();
            }
        });

        this.server.on('clientError', (err, socket) => {
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        });
    }

    listen() {
        this._verbose('starting to listen');

        return new Promise((resolve, reject) => {
            this.server.once('error', reject);
            this.server.listen(this.port, resolve);
        }).then(
            () => this._info(`listening on port ${this.port}.`),
            e => this._error(`failed to listen: ${e}`));
    }

    close() {
        return new Promise((resolve, reject) => {
            this.server.close(resolve);
        });
    }
}