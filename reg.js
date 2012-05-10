var formidable=require('formidable'),
    util=require('util'),
	express=require('express'),
	url=require('url'),
	fs=require('fs'),
	app=express.createServer(),
	crypto=require('crypto'),
	config=require('./config'),
	db=require("mysql-native").createTCPClient(config.dbIP);

db.auto_prepare=true;
db.auth(config.dbPass,config.dbUser);

app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.static(__dirname+'/public'));
	app.use(express.errorHandler({dumpExceptions:false,showStack:false}));
});

var rest;

app.get('/',function(req,res){
	res.writeHead(200, {'content-type': 'text/html'});
    res.end(
	'<head>'+
    '<meta http-equiv="Content-Type" content="text/html; '+
    'chtarset=UTF-8" />'+
    '</head>'+  
      '<form action="/upload" method="post">'+
      '<input type="text" name="user"><br>'+
      '<input type="password" name="pass"><br>'+
      '<input type="text" name="display"><br>'+
      '<input type="text" name="email"><br>'+
      '<input type="submit" value="Upload">'+
      '</form>'
    );
});

app.post('/upload',function(req,res){
    var user=req.body.user;
    var pass=req.body.pass;
    var display=req.body.display;
    var email=req.body.email;
    var iter=16;
    var salt="cnxcnxcnx";
    for(var i=0;i<iter;++i){
        console.log(pass);
        pass+=salt;
        pass=crypto.createHash("md5").update(pass).digest("hex");
    }
    db.query("use "+config.userTableName);
    db.query("INSERT INTO users SET name='"+user+"',pass='"+pass+"',email='"+email+"',display_name='"+display+"',salt='"+salt+"',iter="+iter+",status=1");
});

app.listen(config.appPort);
console.log('listening on http://localhost:'+config.appPort+'/');
