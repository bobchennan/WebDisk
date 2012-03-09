var formidable=require('formidable'),
    util=require('util'),
	express=require('express'),
	url=require('url'),
    winston=require('winston'),
	fs=require('fs'),
	app=module.exports=express.createServer(),
	crypto=require('crypto'),
	config=require('./config'),
	db=require("mysql-native").createTCPClient(config.dbIP),
    Redis=require('connect-redis')(express);

var logger=new (winston.Logger)({
    transports:[
        new(winston.transports.Console)(),
        new(winston.transports.File)({
            filename:config.logFile,
            handleExceptions: true 
        })
    ]
});
logger.info("begin to watch");

db.auto_prepare=true;
db.auth(config.dbPass,config.dbUser);

function generator_str(bits) { //生成随机字符串
  var chars, rand, i, ret; 
  chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'; 
  ret = ''; // in v8, Math.random() yields 32 pseudo-random bits (in spidermonkey it gives 53) 
  while (bits > 0) { 
    // 32-bit integer 
    rand = Math.floor(Math.random() * 0x100000000); 
    // base 64 means 6 bits per character, so we use the top 30 bits from rand to give 30/6=5 characters. 
    for (i = 26; i > 0 && bits > 0; i -= 6, bits -= 6) { 
      ret += chars[0x3F & rand >>> i]; 
    } 
  }
  return ret;
}
function hashname(s){  //哈希文件名
	s=encodeURIComponent(s+generator_str(10));
	return crypto.createHash('md5').update(s).digest("hex");
}

app.configure(function(){
	app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        secret:'cnx',
        store:new Redis({port:config.redisPort})
    }));
	app.use(express.methodOverride());
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.static(__dirname+'/public'));
	app.use(app.router);
	app.use(express.errorHandler({dumpExceptions:false,showStack:false}));
});

app.get('/',function(req,res){
    if(!req.session.wrong)res.render('upload.jade',{name:req.session.name,err:0});
    else{
        req.session.wrong=0;
        res.render('upload.jade',{name:req.session.name,err:1});
    }
});

app.get('/upload.node',function(req,res){
    if(!req.session.user)return [];
    rest=[];
    db.query("use "+config.dbNameofApp);
	db.query("SELECT * from hash_files where user='"+req.session.user+"';")
		.on("row",function(r){
			rest.push({
				name:decodeURIComponent(r['file']),
				size:r['size'],
				url:url.parse('file.node/'+r['hashcode']).pathname,
				delete_url:url.parse("delete.node/"+r['hashcode']).pathname,
				delete_type:"GET"
			});
		})
        .on("end",function(r){
            res.send(rest);
        });
});

app.get('/delete.node/:name',function(req,res){
    var user=req.session.user;
	var name=req.params.name;
	db.query("use "+config.dbNameofApp);
    db.query("SELECT * from hash_files where hashcode='"+name+"';")
	    .on("row",function(r){
	        if(r['user']==user){
	            db.query("use "+config.dbNameofApp);
	            db.query("DELETE from hash_files WHERE hashcode='"+name+"';");
	            fs.unlinkSync(config.uploadDir+name,function(err){
	                if(err)winston.info("fail to del "+file);
	            });
	        }
	    });
});

app.get('/file.node/:name',function(req,res){
    var name=req.params.name;
    var cnt=0;
	db.query("use "+config.dbNameofApp);
	db.query("SELECT * from hash_files where hashcode='"+name+"';")
	    .on("row",function(r){
	        ++cnt;
			res.header('Content-Type',"application/octet-stream;charset=utf-8");
            res.header('Content-Length',r['size']);
            res.header('Content-Disposition',"attachment;filename="+r['file']);
            res.sendfile(config.uploadDir+name);
	    })
	    .on("end",function(r){
	        if(!cnt)res.redirect('/');
	    });
});

app.get('/logout.node',function(req,res){
    req.session.destroy();
    res.redirect('/');
});

app.post('/',function(req,res,next){
	var p_user=req.body.user;
    var p_pass=req.body.pass;
    db.query("use "+config.dbNameofUser);
    var result=db.query("SELECT * from "+config.dbNameofUser+" WHERE name='"+p_user+"';");
    var cnt=0;
    result.on('row',function(r){
        ++cnt;
        var iter=r['iter'];
        var salt=r['salt'];
        for(var i=0;i<iter;i++){
            p_pass+=salt;
            p_pass=crypto.createHash("md5").update(p_pass).digest("hex");
        }
        if(p_pass==r['pass']){
            req.session.user=p_user;
            req.session.name=r['display_name'];
            req.session.wrong=0;
            var cnt1=0;
            db.query("use "+config.dbNameofApp);
            db.query("SELECT * from allow_users where user='"+p_user+"';")
                .on("row",function(r){
                    ++cnt1;
                })
                .on("end",function(){
                    if(!cnt1){
                        req.session.allow=false;
                    }
                    else{
                        req.session.allow=true;
	                }
                    res.redirect('/');
                });
        }
        else{
            //res.writeHead(200,{"Content-Type":"text/html"});
            req.session.wrong=true;
            res.redirect('/');
        }
    });
    result.on('end',function(){
        if(!cnt){
            //res.writeHead(200,{"Content-Type":"text/html"});
            req.session.wrong=true;
			res.redirect('/');
        }
    });
});

app.post('/upload.node',function(req,res){
    if(!req.session.allow){
        var err=[{error:"没有权限上传"}];
        res.send(err);
        return;
    }
    var form = new formidable.IncomingForm();
	var res_obj=[],files=[];
    form.encoding='utf-8';
    form.uploadDir = config.uploadDir;
    form
	    .on('fileBegin',function(field,file){
		    var s=file.name;
		    var ss=hashname(s);
		    file.path=config.uploadDir+ss;
		    files.push(config.uploadDir+ss);
	    })
        .on('file', function(field, file) {
		    var s=file.name;
		    var ss=file.path.substr((config.uploadDir).length);
		    db.query("use "+config.dbNameofApp);
		    db.query("INSERT INTO hash_files (file,hashcode,size,user) VALUES('"+encodeURIComponent(s)+"','"+ss+"',"+file.size+",'"+req.session.user+"')");
		    res_obj.push({
			    name:file.name,
			    size:file.size,
			    url:url.parse('file.node/'+ss).pathname,
			    delete_url:url.parse("delete.node/"+ss).pathname,
			    delete_type:"GET"
		    })
        })
	    .on('end',function(){
            res.send(res_obj);
	    });
	form.parse(req,function(err,fields,files){
    });
});

app.get('*',function(req,res){
		var body="页面不存在:-(";
		res.writeHead(404,{
			"Content-Type":"text/html;charset=utf-8",
			"Content-Length":Buffer.byteLength(body,'utf8'),
			"Server":"NodeJs("+process.version+")"
		});
		res.write(body);
		res.end();
});

app.listen(config.appPort);
console.log('listening on http://localhost:'+config.appPort+'/');
