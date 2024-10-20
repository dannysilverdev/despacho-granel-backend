const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'dummyAccessKeyId',
  secretAccessKey: 'dummySecretAccessKey',
});

const params = {
  TableName: 'DespachoGranelTable',
};

dynamoDb.scan(params, (err, data) => {
  if (err) {
    console.error('Unable to scan the table. Error:', JSON.stringify(err, null, 2));
  } else {
    console.log('Scan succeeded:', JSON.stringify(data, null, 2));
  }
});
