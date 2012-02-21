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
	app.use(app.router);
	app.set('views', __dirname);
	app.set('view engine', 'jade');
	app.use(express.static(__dirname));
	app.use(express.errorHandler({dumpExceptions:true,showStack:true}));
});

var rest;

app.get('/',function(req,res){
	var realpath=__dirname+'\\tmp\\';
	rest=[];
	fs.readdir(realpath,function(err,files){
		files.forEach(function(file){
			fs.stat(realpath+file,function(err,stat){
				db.query("SELECT * from hash_files WHERE hashcode='"+file+"';")
				.on("row",function(r){
				rest.push({
					name:decodeURIComponent(r['file']),
					size:stat.size,
					url:url.parse('file/'+file).pathname,
					delete_url:url.parse("delete.node/"+file).pathname,
					delete_type:"GET"
				});
				});
			});
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
	var realpath2=__dirname+url.parse('\\upload.html').pathname;
	var txt=fs.readFileSync(realpath2);
	res.end(txt);	
});

app.get('/upload.node',function(req,res){
	res.send(rest);
});

TEST_PORT=8000;
TEST_TMP=__dirname+'\\'+'tmp';
app.get('/delete.node/:name',function(req,res){
try{
	var file=req.params.name;
	db.query("DELETE from hash_files WHERE hashcode='"+file+"';");
	fs.unlinkSync(TEST_TMP+'\\'+file,function(err){
		if(err)console.log("fail to del"+file);
		else console.log("success to del"+file);
	});
}catch(err){}
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
		file.path=TEST_TMP+"\\"+ss;
		files.push(TEST_TMP+"\\"+ss);
		db.query("INSERT INTO hash_files (file,hashcode) VALUES('"+encodeURIComponent(s)+"','"+ss+"')");
		res_obj.push({
			name:file.name,
			size:file.size,
			url:url.parse('file/'+ss).pathname,
			delete_url:url.parse("delete.node/"+ss).pathname,
			delete_type:"GET"
			//thumbnail_url:url.parse("cnx.png").pathname
		})
	  })
      .on('file', function(field, file) {
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

app.listen(8000);
console.log('listening on http://localhost:'+TEST_PORT+'/');
