# Project Name

Rabbiteer IOT project agent and related files. It shovels stuff pushed throught MQTT into
InfluxDB and does some other useful stuffs.

## Installation

None unfortunately.

## Usage

In leu of actual instructions. Here's the `--help` output:
```

Usage: rabbiteer-2017-iot-agent [options]


  Options:

    -V, --version                       output the version number
    -m, --mqtt [url]                    The MQTT url. Defaults to mqtt://localhost
    -u, --username [username]           the MQTT username
    -p, --password [password]           the MQTT password
    -i, --influxdb [hostport]           The InfluxDB host and port. Defaults to localhost:8086
    -d, --influxdb-database [database]  The InfluxDB database. Defaults to rabbiteer
    --influxdb-username [username]      The InfluxDB username. Defaults to the MQTT username
    --influxdb-password [password]      The InfluxDB password. Defaults to the MQTT password
    -r, --rabbitmq [url]                The RabbitMQ management interface url. Defaults to http://localhost:15672/
    --rabbitmq-username [username]      The RabbitMQ username. Defaults to the MQTT username
    --rabbitmq-password [password]      The RabbitMQ password. Defaults to the MQTT password
    --slack-token [token]               A token for accessing the slack API
    --slack-verification-token [token]  A token for verifying the requests for the events API
    --event-port [port]                 The port on which to listen for HTTP events. Defaults to $PORT or 5295
    --loglevel [level]                  The minimum log level. Same as npm log levels. Default is info.
    -h, --help                          output usage information

```


## License

See LICENSE
