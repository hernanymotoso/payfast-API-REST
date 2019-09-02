var cluster= require('cluster');
var os = require('os');

var cpus = os.cpus();
//console.log(cpus);


console.log('Executando thread');

if(cluster.isMaster){
      console.log('thread master');

      cpus.forEach( function(){
            cluster.fork();
      });

      cluster.on('listening', function(worker){
            console.log('cluster connectad o' + worker.process.pid );
      });

      cluster.on('exit', worker => {
            console.log('cluster %d desconectado', worker.process.pid);
            cluster.fork();
      });


}else{
      console.log('thread slave');
      require('./index.js');
}
//slave

