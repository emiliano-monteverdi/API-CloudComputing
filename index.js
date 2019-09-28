const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({
    apiVersion: '2012-08-10',
    endpoint: 'http://dynamodb:8000',
    region: 'us-west-2',
    credentials: {
        accessKeyId: '2345',
        secretAccessKey: '2345'
    }
});
const docClient = new AWS.DynamoDB.DocumentClient({
    apiVersion: '2012-08-10',
    service: dynamodb
});
exports.handler = (event, context, callback) => {

    switch (event.httpMethod) {
        case "GET":
            if (event.path.includes('/envios/pendientes')) { // pendientes
                var params = {
                    TableName: 'Envio',
                    IndexName: 'EnviosPendientesIndex'
                };
                dynamodb.scan(params, function (err, data) {
                    if (err) {
                        console.log(`error`, err);
                        callback(err, null);
                    }
                    else {
                        console.log(`success: returned ${data.Items}`);
                        callback(null, response(200, parseItems(data.Items)));
                    }
                });
                break;
            }
            if ((event.pathParameters || {}).idEnvio || false) { // id
                var params = {
                    TableName: 'Envio',
                    Key: {
                        id: id
                    }
                };
                docClient.get(params, function (err, data) {
                    if (err) {
                        console.log(`error`, err);
                        callback(err, null);
                    }
                    else {
                        console.log(`success: returned ${data.Item}`);
                        callback(null, response(200, parseItems(data.Items)));
                    }
                });
                break;
            }
            break;
        case "POST":
            if (event.path.includes('/entregado') && (event.pathParameters || {}).idEnvio || false) { // entregado y id
                var params = {
                    TableName: 'Envio',
                    Key: {
                        id: id
                    },
                    UpdateExpression: 'remove pendiente',
                    ReturnValues: 'ALL_NEW'
                };
                docClient.update(params, function (err, data) {
                    if (err) {
                        console.log(`error`, err);
                        callback(err, null);
                    }
                    else {
                        console.log(`success: returned ${data.Attributes}`);
                        callback(null, response(200, data.Attributes));
                    }
                });
            }
            if (JSON.parse(event.body) || false) { // envio
                var params = {
                    TableName: 'Envio',
                    Item: envio
                };
                docClient.put(params, function (err, data) {
                    if (err) {
                        console.log(`error`, err);
                        callback(err, null);
                    }
                    else {
                        console.log(`success: created ${envio}`);
                        callback(null, response(200, envio));
                    }
                });
            }
            break;
        default:
            console.log("Unsupported Function (" + event.httpMethod
                + ")");
    }


    function getSafe(fn, defaultVal) {
        try {
            return fn();
        } catch (e) {
            return defaultVal;
        }
    }

    function parseItem(Item) {
        let identificador = getSafe(() => Item.id.S, ''),
            fechaAlta = getSafe(() => Item.fechaAlta.S, ''),
            destino = getSafe(() => Item.destino.S, ''),
            email = getSafe(() => Item.email.S, ''),
            pendiente = getSafe(() => Item.pendiente.S, ''),
            salida = getSafe(() => Item.salida.S, '');

        var response = {
            id: identificador,
            fechaAlta: fechaAlta,
            destino: destino,
            email: email,
            pendiente: pendiente,
            salida: salida
        }
        return response;
    }

    function response(status, data) {
        var response = {
            statusCode: status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                'Access-Control-Allow-Origin': `https://localhost:3000`,
            },
            body: JSON.stringify(data),
            isBase64Encoded: false
        }
        return response;
    }

    function parseItems(listOfItems) {
        var list = [];
        listOfItems.forEach(element => {
            list.push(parseItem(element))
        });
        return list;
    }
}
