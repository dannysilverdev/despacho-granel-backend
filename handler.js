const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'DespachoGranel';

// Crear despacho
module.exports.createDespacho = async (event) => {
  const body = JSON.parse(event.body);
  const { numeroGuia, fechaDespacho, nombreCliente, producto, responsable, silo, ordenCompra, carga, descarga } = body;

  const params = {
    TableName: TABLE_NAME,
    Item: { numeroGuia, fechaDespacho, nombreCliente, producto, responsable, silo, ordenCompra, carga, descarga }
  };

  await dynamoDB.put(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Despacho creado exitosamente' }),
  };
};

// Obtener despacho
module.exports.getDespacho = async (event) => {
  const { numeroGuia } = event.pathParameters;

  const params = {
    TableName: TABLE_NAME,
    Key: { numeroGuia }
  };

  const result = await dynamoDB.get(params).promise();

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Despacho no encontrado' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(result.Item),
  };
};

// Editar despacho
module.exports.updateDespacho = async (event) => {
  const { numeroGuia } = event.pathParameters;
  const body = JSON.parse(event.body);
  
  const params = {
    TableName: TABLE_NAME,
    Key: { numeroGuia },
    UpdateExpression: "set fechaDespacho = :f, nombreCliente = :n, producto = :p, responsable = :r, silo = :s, ordenCompra = :o, carga = :c, descarga = :d",
    ExpressionAttributeValues: {
      ":f": body.fechaDespacho,
      ":n": body.nombreCliente,
      ":p": body.producto,
      ":r": body.responsable,
      ":s": body.silo,
      ":o": body.ordenCompra,
      ":c": body.carga,
      ":d": body.descarga
    },
    ReturnValues: "UPDATED_NEW"
  };

  await dynamoDB.update(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Despacho actualizado exitosamente' }),
  };
};

// Eliminar despacho
module.exports.deleteDespacho = async (event) => {
  const { numeroGuia } = event.pathParameters;

  const params = {
    TableName: TABLE_NAME,
    Key: { numeroGuia }
  };

  await dynamoDB.delete(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Despacho eliminado exitosamente' }),
  };
};
