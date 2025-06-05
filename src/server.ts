import http from 'http';
import chalk from 'chalk';
import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const port = process.env.PORT || 3450;
const server = http.createServer(app);

server.listen(port, () => {
  console.log(chalk.bgYellow(' API '));
  console.log(chalk.green(`SERVIDOR LOCAL RODANDO EM http://localhost:${port}`));
});
