const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AuthSentinel API',
      version: '1.0.0',
      description: 'Cloud Native Authentication System — TUBES Cloud Computing.\n\nStack: Node.js + Express + PostgreSQL + Docker + AWS EC2.',
    },
    servers: [{ url: '/api', description: 'Current server' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id:         { type: 'string', format: 'uuid' },
            username:   { type: 'string', example: 'dioaliqbal' },
            email:      { type: 'string', format: 'email' },
            role:       { type: 'string', enum: ['user','admin'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token:   { type: 'string' },
            user:    { $ref: '#/components/schemas/User' },
          },
        },
        Error: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    tags: [
      { name: 'Health',  description: 'Health check' },
      { name: 'Auth',    description: 'Authentication endpoints' },
      { name: 'Users',   description: 'User management' },
      { name: 'System',  description: 'System monitoring' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
