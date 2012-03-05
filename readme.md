<center>Web Disk</center>
====================
***
Web Disk is a *Node.JS* project that supports uploading, managing and downloading files.

### <center>About NodeJS</center>
***
> Node.js is a platform built on Chrome's JavaScript runtime for easily building fast, >scalable network applications. Node.js uses an event-driven, non-blocking I/O model >that makes it lightweight and efficient, perfect for data-intensive real-time >applications that run across distributed devices.

### <center>How to install it</center>
***
First, you need install NodeJS environment on your computer.You can find it from [here](http://nodejs.org/#download). Then it's necessary to install MySQL.

There are two databases using for application.The first is just storing the information such as password for users.The second is one database to store the data using in this app.This database just has two tables, and you can find the structure in Build folder.

Also you need to install [Redis](http://redis.io/topics/quickstart)

And then you need to download the modules used in the app.You can simply cd to the dir includes the app and run these command:

    mkdir node_modules

    cd node_modules

    git clone https://github.com/felixge/node-formidable.git

    git clone https://github.com/visionmedia/express.git

    git clone https://github.com/caolan/async.git

    git clone https://github.com/felixge/node-stack-trace.git

    git clone https://github.com/indexzero/node-pkginfo.git

    git clone https://github.com/flatiron/winston.git

    git clone https://github.com/sidorares/nodejs-mysql-native.git

    git clone https://github.com/visionmedia/connect-redis.git

**remember when you download them all, you should delete the prefix "node" for some folders**

And finish all above, you just need to run "node app.js" in the console.

Be careful about the permission.This application needs to write in one folder to save the uploading files and also needs to read the users table and update the own table.

All the config things that I can remember are just in config.js. You can change it for your destination.

### <center>The folder structure</center>
***
Build: something about installing.(reg.js is a temporary file for author to register users).

easydialog: It's a JQuery plugin.

public: It's include js、css and some files using for UI.(static resources)

server: It's server-slide code written by blueimp.

tmp: It's the temporary folder to store the uploading file.

views: A folder storing all the pages.

### <center>License</center>
***
thanks to the following author:

[Express](http://expressjs.com/):A really good MVC framework.

[felixge / node-formidable](https://github.com/felixge/node-formidable):using in the server-slide to handle uploding.

[blueimp / jQuery-File-Upload](https://github.com/blueimp/jQuery-File-Upload):UI.

[雨夜带刀](http://stylechen.com/easydialog.html):a plugin which can pop-up a dialog with small size and easy usage.

My classmates such as xjia,ftiasch and so on.
