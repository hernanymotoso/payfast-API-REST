var winston = require('winston');

/*
var fs = require('fs');

if(!fs.existsSync('logs')){              NÃO FUNCIONOU
      fs.mkdirSync('logs');
}*/
module.exports = winston.createLogger({

      transports: [
            new winston.transports.File({
                  format: winston.format.combine(
                      winston.format.timestamp(),  
                      winston.format.json()
                  ),
                  level: "info",
                  filename: "logs/payfast.log",
                  maxsize: 100000,
                  maxFiles: 10
            })
      ]
});

