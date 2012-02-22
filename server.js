var formidable=require('formidable'),
	util=require('util'),
	express=require('express'),
	url=require('url'),
	fs=require('fs'),
	app=express.createServer(),
	crypto=require('crypto'),
	db=require("mysql-native").createTCPClient('127.0.0.1');

db.auto_prepare=true;
var auth=db.auth('','root');
var DATABASE_NAME="OJ";
db.query('use '+DATABASE_NAME);

TEST_TMP=__dirname+'/'+'tmp';
TEST_PORT=8888;

function generator_str(bits) { 
  var chars, rand, i, ret; 
  chars = 
'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'; 
  ret = ''; 
  // in v8, Math.random() yields 32 pseudo-random bits (in spidermonkey it gives 53) 
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
function hashname(s){
	s=encodeURIComponent(s+generator_str(10));
	return crypto.createHash('md5').update(s).digest("hex");
}

app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.static(__dirname+'/public'));
	app.use(app.router);
	app.use(express.errorHandler({dumpExceptions:false,showStack:false}));
});

var rest;

app.get('/',function(req,res){
	var realpath=__dirname+'/tmp/';
	rest=[];
	db.query("SELECT * from hash_files;")
		.on("row",function(r){
			rest.push({
				name:decodeURIComponent(r['file']),
				size:r['size'],
				url:url.parse('file/'+r['hashcode']).pathname,
				delete_url:url.parse("delete.node/"+r['hashcode']).pathname,
				delete_type:"GET"
			});
		});
	res.writeHead(200, {'content-type': 'text/html'});
    /*res.end(
	'<head>'+
    '<meta http-equiv="Content-Type" content="text/html; '+
    'chtarset=UTF-8" />'+
    '</head>'+  
      '<form action="/upload" enctype="multipart/form-data" method="post">'+
      '<input type="text" name="title"><br>'+
      '<input type="file" name="upload" multiple="multiple"><br>'+
      '<input type="submit" value="Upload">'+
      '</form>'
    );*/
	var realpath2=__dirname+url.parse('/views/upload.html').pathname;
	var txt=fs.readFileSync(realpath2);
	res.end(txt);	
});

app.get('/upload.node',function(req,res){
	res.send(rest);
});

app.get('/delete.node/:name',function(req,res){
try{
	var file=req.params.name;
	db.query("DELETE from hash_files WHERE hashcode='"+file+"';");
	fs.unlinkSync(TEST_TMP+'/'+file,function(err){
		if(err)console.log("fail to del"+file);
		else console.log("success to del"+file);
	});
}catch(err){}
});
app.get('/file/:name',function(req,res,next){
	var name=req.params.name;
	var s=TEST_TMP+'/'+name;
	var stats=fs.lstatSync(s);
	if(stats.isFile()){
		db.query("SELECT * from hash_files WHERE hashcode='"+name+"';").on("row",function(r){
			fs.readFile(s,"binary",function(err,file){
				res.writeHead(200,{
					"Content-Type":"application/octet-stream;charset=utf-8",
					"Content-Length":stats.size,
					"Content-Disposition":"attachment;filename="+r['file']
				});
				res.write(file,"binary");
				res.end();
			})
		})
	}
	else{
		next();
	}
});
app.post('/login.node',function(req,res){
	res.write('user: '+req.body.user);
	res.end('pass: '+req.body.pass);
});
app.post('/upload.node',function(req,res){
	var form = new formidable.IncomingForm();
	var res_obj=[],files=[];
	
	form.encoding='utf-8';
    form.uploadDir = TEST_TMP;

    form
	  .on('error',function(){
		res.writeHead(404, {'content-type': 'text/plain'});
		res.end('404');
	  })
	  .on('aborted',function(){
		files.forEach(function(file){
			fs.unlinkSync(file,function(err){
				if(err)console.log("fail to del"+file);
				else console.log("success to del"+file);
			});
		});
	  })
	  .on('fileBegin',function(field,file){
		var s=file.name;
		var ss=hashname(s);
		file.path=TEST_TMP+"/"+ss;
		files.push(TEST_TMP+"/"+ss);
	  })
      .on('file', function(field, file) {
		var s=file.name;
		var ss=file.path.substr((TEST_TMP+"/").length);
		db.query("INSERT INTO hash_files (file,hashcode,size) VALUES('"+encodeURIComponent(s)+"','"+ss+"',"+file.size+")");
		res_obj.push({
			name:file.name,
			size:file.size,
			url:url.parse('file/'+ss).pathname,
			delete_url:url.parse("delete.node/"+ss).pathname,
			delete_type:"GET"
			//thumbnail_url:url.parse("cnx.png").pathname
		})
      })
	  .on('progress',function(receive,expect){
		  //console.log(receive/expect);
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

app.listen(TEST_PORT);
console.log('listening on http://localhost:'+TEST_PORT+'/');
