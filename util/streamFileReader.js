var fs = require('fs');

fs.createReadStream('coracao.png')
  .pipe(fs.createWriteStream('imagem3-com-stream.png'))
  .on('finish', function(){
      console.log('arquivo escrito com stream');
  });  