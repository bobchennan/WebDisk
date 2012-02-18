/***
 * @author flyingzl
 * @date 2010-11-27
 * һ������Node.js�ļ��ļ�������
 */

var fs=require("fs"),
    http=require("http"),
    url=require("url"),
    path=require("path"),
    mime=require("./mime").mime,
    util=require('util');

//www��Ŀ¼
var root=__dirname,
    host="127.0.0.1",
    port="8888";
    
    
if(!path.existsSync(root)){
    util.error(root+"�ļ��в����ڣ��������ƶ����ļ��У�");
    process.exit();
}
    
//��ʾ�ļ���������ļ�
function listDirectory(parentDirectory,req,res){
    fs.readdir(parentDirectory,function(error,files){
        var body=formatBody(parentDirectory,files);
        res.writeHead(200,{
            "Content-Type":"text/html;charset=utf-8",
            "Content-Length":Buffer.byteLength(body,'utf8'),
            "Server":"NodeJs("+process.version+")"
        });
        res.write(body,'utf8');
        res.end();
    });

}

//��ʾ�ļ�����
function showFile(file,req,res){
    fs.readFile(filename,'binary',function(err,file){
        var contentType=mime.lookupExtension(path.extname(filename));
        res.writeHead(200,{
            "Content-Type":contentType,
            "Content-Length":Buffer.byteLength(file,'binary'),
            "Server":"NodeJs("+process.version+")"
        });
        res.write(file,"binary");
        res.end();
    })
}

//��Webҳ������ʾ�ļ��б���ʽΪ<ul><li></li><li></li></ul>
function formatBody(parent,files){
    var res=[],
        length=files.length;
    res.push("<!doctype>");
    res.push("<html>");
    res.push("<head>");
    res.push("<meta http-equiv='Content-Type' content='text/html;charset=utf-8'></meta>")
    res.push("<title>Node.js�ļ�������</title>");
    res.push("</head>");
    res.push("<body width='100%'>");
    res.push("<ul>")
    files.forEach(function(val,index){
        var stat=fs.statSync(path.join(parent,val));
        if(stat.isDirectory(val)){
            val=path.basename(val)+"/";
        }else{
            val=path.basename(val);
        }
        res.push("<li><a href='"+val+"'>"+val+"</a></li>");
    });
    res.push("</ul>");
    res.push("<div style='position:relative;width:98%;bottom:5px;height:25px;background:gray'>");
    res.push("<div style='margin:0 auto;height:100%;line-height:25px;text-align:center'>Powered By Node.js</div>");
    res.push("</div>")
    res.push("</body>");
    return res.join("");
}

//����ļ��Ҳ�������ʾ404����
function write404(req,res){
    var body="�ļ�������:-(";
    res.writeHead(404,{
        "Content-Type":"text/html;charset=utf-8",
        "Content-Length":Buffer.byteLength(body,'utf8'),
        "Server":"NodeJs("+process.version+")"
    });
    res.write(body);
    res.end();
}

//����������
http.createServer(function(req,res){
    //��url��ַ���е�%20�滻Ϊ�ո񣬲�ȻNode.js�Ҳ����ļ�
    var pathname=url.parse(req.url).pathname.replace(/%20/g,' '),
        re=/(%[0-9A-Fa-f]{2}){3}/g;
    //�ܹ���ȷ��ʾ���ģ������ֽڵ��ַ�ת��Ϊutf-8����
    pathname=pathname.replace(re,function(word){
        var buffer=new Buffer(3),
            array=word.split('%');
        array.splice(0,1);
        array.forEach(function(val,index){
            buffer[index]=parseInt('0x'+val,16);
        });
        return buffer.toString('utf8');
    });
    if(pathname=='/'){
        listDirectory(root,req,res);
    }else{
        filename=path.join(root,pathname);
        path.exists(filename,function(exists){
            if(!exists){
                util.error('�Ҳ����ļ�'+filename);
                write404(req,res);
            }else{
                fs.stat(filename,function(err,stat){
                    if(stat.isFile()){
                        showFile(filename,req,res);
                    }else if(stat.isDirectory()){
                        listDirectory(filename,req,res);
                    }
                });
            }
        });
    }
    
    
}).listen(port,host);

util.debug("��������ʼ���� http://"+host+":"+port)
