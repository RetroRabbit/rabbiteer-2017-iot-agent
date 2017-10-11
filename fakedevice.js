const mqtt = require('mqtt');


const client = mqtt.connect(
    'mqtts://iot.rabbiteer.io', {
        clientId: 'snowbird',
        username: 'snowbird',
        password: 'snowbird'
    });

client.on('connect', function () {
    console.log('connected');
});


client.on('error', function (e) {
    console.error(e || 'error');
});

function plusminus(r = 1) {
    return (Math.random() * 2 - 1) * r;
}

var temp = 25 + plusminus(5);
var hum = 50 + plusminus(25);

setInterval(() => {
    temp += plusminus(1);
    hum += plusminus(1);
    client.publish(`temprature/${client.options.clientId}`, temp.toString(), { retain: true });
    client.publish(`humidity/${client.options.clientId}`, hum.toString(), { retain: true });
}, 5000);