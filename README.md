# Project Name

Rabbiteer IOT project agent and related files. It shovels stuff pushed throught MQTT into
InfluxDB and does some other useful stuffs.

## Installation

TODO: Make an installation process

## Usage

In leu of actual instructions. Here's the `--help` output:
```

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
    -h, --help                          output usage information
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

See LICENSE
