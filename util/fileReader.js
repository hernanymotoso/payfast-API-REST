var fs = require('fs');

fs.readFile('coracao.png', function(error, buffer){
    console.log('arquivo lido');

    fs.writeFile('imagem2.png', buffer, function(err){
        console.log('arquivo escrito')
    });

});
