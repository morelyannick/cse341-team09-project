import swaggerJsdoc from 'swagger-jsdoc';
import Path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

const swaggerSpecs = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Kizuna Rail API',
      version: '1.0.0',
      description: 'API documentation for Kizuna Rail'
    },
    servers: [{ url: '/' }]
  },
  apis: [Path.join(__dirname, 'routes', 'api-routes.js')]
});

export default swaggerSpecs;
