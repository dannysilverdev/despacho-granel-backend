const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB({
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'dummyAccessKeyId',
  secretAccessKey: 'dummySecretAccessKey',
});

const params = {
  TableName: 'DespachoGranelTable',
  AttributeDefinitions: [
    { AttributeName: 'userId', AttributeType: 'S' },
  ],
  KeySchema: [
    { AttributeName: 'userId', KeyType: 'HASH' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

dynamoDb.createTable(params, (err, data) => {
  if (err) {
    console.error('Unable to create table. Error:', JSON.stringify(err, null, 2));
  } else {
    console.log('Created table successfully:', JSON.stringify(data, null, 2));
  }
});
