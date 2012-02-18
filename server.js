var formidable=require('formidable'),
	util=require('util'),
	express=require('express'),
	url=require('url'),
	fs=require('fs'),
	app=express.createServer();

app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.set('views', __dirname);
	app.set('view engine', 'jade');
	app.use(express.static(__dirname));
	app.use(express.errorHandler({dumpExceptions:true,showStack:true}));
});

app.get('/',function(req,res){
	res.writeHead(200, {'content-type': 'text/html'});
    /*res.end(
	'<head>'+
    '<meta http-equiv="Content-Type" content="text/html; '+
    'charset=UTF-8" />'+
    '</head>'+  
      '<form action="/upload" enctype="multipart/form-data" method="post">'+
      '<input type="text" name="title"><br>'+
      '<input type="file" name="upload" multiple="multiple"><br>'+
      '<input type="submit" value="Upload">'+
      '</form>'
    );*/
	var realpath=__dirname+url.parse('\\upload.html').pathname;
	var txt=fs.readFileSync(realpath);
	res.end(txt);
});

TEST_PORT=8000;
TEST_TMP=__dirname+'\\'+'tmp';
app.get('/delete.cpp/:name',function(req,res){
	fs.unlinkSync(TEST_TMP+'\\'+req.params.name,function(err){
		if(err)console.log("fail to del"+req.params);
		else console.log("success to del"+req.params);
	});
});
app.post('/upload',function(req,res){
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
		file.path=TEST_TMP+"\\"+file.name;
		files.push(TEST_TMP+"\\"+file.name);
	  })
      .on('file', function(field, file) {
		res_obj.push({
			name:file.name,
			size:file.size,
			url:url.parse(file.name).pathname,
			delete_url:url.parse("delete.cpp/"+encodeURIComponent(file.name)).pathname,
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

app.listen(8000);
console.log('listening on http://localhost:'+TEST_PORT+'/');
