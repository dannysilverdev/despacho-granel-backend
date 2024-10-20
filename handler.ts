import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Configurar DynamoDB para conectar a la versión local si estamos trabajando en modo offline
let options: AWS.DynamoDB.DocumentClient.DocumentClientOptions & AWS.DynamoDB.Types.ClientConfiguration = {};
if (process.env.IS_OFFLINE === 'true') {
  options = {
    region: 'localhost',
    endpoint: 'http://localhost:8000', // Conectar a DynamoDB local
    accessKeyId: 'dummyAccessKeyId', // Credenciales ficticias
    secretAccessKey: 'dummySecretAccessKey', // Credenciales ficticias
  };
}

const dynamoDb = new AWS.DynamoDB.DocumentClient(options);
const USERS_TABLE = process.env.USERS_TABLE || 'DespachoGranelTable';
const JWT_SECRET = process.env.JWT_SECRET || 'b3610d50-c165-4b06-ab8b-b2eacf8faa56';

// Variable para la URL de origen permitida
type Environments = 'local' | 'remote';
const CURRENT_ENV: Environments = process.env.IS_OFFLINE === 'true' ? 'local' : 'remote';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || (CURRENT_ENV === 'local' ? 'http://127.0.0.1:5173' : 'https://dz17oj4ivartw.cloudfront.net');

export const home: APIGatewayProxyHandler = async (event) => {
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN, // Origen permitido según el entorno
        'Access-Control-Allow-Headers': 'Authorization', // Permite el header de Authorization
      },
      body: JSON.stringify({ message: 'Authorization header missing' }),
    };
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verificar el token JWT
    jwt.verify(token, JWT_SECRET);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN, // Origen permitido según el entorno
        'Access-Control-Allow-Headers': 'Authorization', // Permite el header de Authorization
      },
      body: JSON.stringify({ message: 'Bienvenido al sistema de Despacho Granel!' }),
    };
  } catch (error) {
    return {
      statusCode: 403,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN, // Origen permitido según el entorno
        'Access-Control-Allow-Headers': 'Authorization', // Permite el header de Authorization
      },
      body: JSON.stringify({ message: 'Invalid or expired token', error: error instanceof Error ? error.message : 'Unknown error' }),
    };
  }
};

// Modulo de Despacho
export const dispatch: APIGatewayProxyHandler = async (event) => {
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN, // Origen permitido según el entorno
        'Access-Control-Allow-Headers': 'Authorization', // Permite el header de Authorization
      },
      body: JSON.stringify({ message: 'Authorization header missing' }),
    };
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verificar el token JWT
    jwt.verify(token, JWT_SECRET);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN, // Origen permitido según el entorno
        'Access-Control-Allow-Headers': 'Authorization', // Permite el header de Authorization
      },
      body: JSON.stringify({ message: 'Formulario de despacho' }),
    };
  } catch (error) {
    return {
      statusCode: 403,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN, // Origen permitido según el entorno
        'Access-Control-Allow-Headers': 'Authorization', // Permite el header de Authorization
      },
      body: JSON.stringify({ message: 'Invalid or expired token', error: error instanceof Error ? error.message : 'Unknown error' }),
    };
  }
};

// Función para registrar un nuevo usuario (signup)
export const signup: APIGatewayProxyHandler = async (event) => {
  const { username, password } = JSON.parse(event.body || '{}');

  if (!username || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Username and password are required' }),
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: username,
      password: hashedPassword,
    },
  };

  try {
    await dynamoDb.put(params).promise();
    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'User created successfully' }),
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({ message: 'Error creating user', error: error.message }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: 'Unknown error while creating user' }),
    };
  }
};

// Función para iniciar sesión (login) con JWT y cabeceras CORS
export const login: APIGatewayProxyHandler = async (event) => {
  const { username, password } = JSON.parse(event.body || '{}');

  if (!username || !password) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: 'Username and password are required' }),
    };
  }

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: username,
    },
  };

  try {
    const { Item } = await dynamoDb.get(params).promise();

    if (!Item || !(await bcrypt.compare(password, Item.password))) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({ message: 'Invalid credentials' }),
      };
    }

    // Generar un token JWT con el userId del usuario
    const token = jwt.sign({ userId: Item.userId }, JWT_SECRET, { expiresIn: '1h' });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,  // Origen permitido según el entorno
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ token }),
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({ message: 'Error al iniciar sesión', error: error.message }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: 'Unknown error while logging in' }),
    };
  }
};
