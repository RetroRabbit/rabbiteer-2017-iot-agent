const request = require('request-promise');

class RabbitMqApiConnection {
    constructor(options) {

        if (!options) throw "options was not specified";

        if (typeof options == "string") {
            options = {
                url: options
            };
        }

        if (!options.url) throw "options.url was not specified";

        this.options = options;

        if (options.logger) {
            this._verbose = options.logger.verbose.bind(options.logger);
            this._error = options.logger.error.bind(options.logger);
            this._warn = options.logger.warn.bind(options.logger);
            this._silly = options.logger.silly.bind(options.logger);
            this._debug = options.logger.debug.bind(options.logger);
            this._info = options.logger.info.bind(options.logger);
        } else {
            const f = function () { };
            this._verbose = f;
            this._error = f;
            this._warn = f;
            this._silly = f;
            this._debug = f;
            this._info = f;
        }
    }

    async _request(path, method = 'GET', body = undefined) {
        const apiurl = this.options.url.endsWith('/') ? this.options.url : `${this.options.url}/`;
        const username = this.options.username;
        const password = this.options.password;
        const url = `${apiurl}${path}`;
        const auth = username && password && {
            user: username, pass: password
        };

        this._verbose(`RabbitMQ Request ${method} ${path}`);
        if (body) { this._silly(`RabbitMQ Request body: ${JSON.stringify(body)}`); }

        try {
            const response = await request(url, { method, auth, body, json: true });
            this._silly(`RabbitMQ Request ${method} ${path} response: ${JSON.stringify(response)}`);
            return response;
        }
        catch (e) {
            this._warn(`RabbitMQ Request error ${method} ${path} error: ${JSON.stringify(e)}`);
            throw e;
        }
    }

    _post(path, body) {
        return this._request(path, 'POST', body);
    }

    _get(path) {
        return this._request(path, 'GET');
    }

    getUsers() {
        return this._get('/api/users');
    }

    getUser(name) {
        return this._get(`/api/users/${encodeURIComponent(name)}`);
    }

    addUser(username, password) {
        return this._post(`/api/users/${encodeURIComponent(username)}`, { password });
    }

    getConnections() {
        return this._get('/api/connections');
    }
}


module.exports = {
    RabbitMqApiConnection
};