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
    }

    async _request(path, method = 'GET', body = undefined) {
        const apiurl = this.options.url.endsWith('/') ? this.options.url : `${this.options.url}/`;
        const username = this.options.username;
        const password = this.options.password;
        const url = `${apiurl}${path}`;
        const auth = username && password && {
            user: username, pass: password
        };

        const response = await request(url, { method, auth, body, json: true });

        return response;
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