var cluster=require('cluster');
var config=require('./config');

if(cluster.isMaster){
    for(var i=0;i<config.process_num;++i){
        cluster.fork();
    }

    cluster.on('death',function(worker){
        cluster.fork();
    });
}else{
    var app=require('./cnx');
    app.listen(config.appPort);
}
