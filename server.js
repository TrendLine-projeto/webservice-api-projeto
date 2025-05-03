const http = require('http');
const chalk = require('chalk');
const app = require('./app')
const port = process.env.PORT || 3400;
const server = http.createServer(app);

require('dotenv').config()

server.listen(port, () => {
    console.log(chalk.bgYellow(` API `))
    console.log(chalk.green(`SERVIDOR LOCAL RODANDO EM http://localhost:${port}`))
});