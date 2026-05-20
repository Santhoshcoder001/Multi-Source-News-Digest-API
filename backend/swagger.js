import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';

export function setupSwagger(app) {
  const swaggerFilePath = path.resolve(process.cwd(), 'swagger.yaml');
  const swaggerDocument = yaml.load(fs.readFileSync(swaggerFilePath, 'utf8'));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}