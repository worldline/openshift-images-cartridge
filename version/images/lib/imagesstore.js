/*
 * imagesStore
 * https://github.com//imagesstore
 *
 * Copyright (c) 2013 
 * Licensed under the MIT license.
 */

'use strict';

exports.awesome = function() {
  return 'awesome';
};

var fs=require('fs')
var gm = require('gm')
var imageMagick = gm.subClass({ imageMagick: true });
var hostname = require("os").hostname();
var path = require("path");

var lastId=0
var uidgenerator = function(){
  var uid=hostname+(+new Date()/1)+(++lastId)
  return new Buffer(uid).toString('base64')
}
// Config
var allowedType={'image/png':'.png','image/jpeg':'.jpeg'}
var maxSize = 40000000;
var baseUploadPath= "<%= ENV['OPENSHIFT_IMAGES_DIR'] %>version/images/public/uploads/"
// End config


var store = function(req,res,next) {
	   var key = req.input.apikey;
     if(key!=process.env.OPENSHIFT_IMAGES_KEY)
    {
        res.end(key+' is an invalid API key')
    }
    var uid = uidgenerator();
    //console.log(req.files.file)
    try
    {
      if(req.files.file.size>maxSize)
      {
        throw "File is too big" 
      }
      var extension=allowedType[req.files.file.type];
      if(extension===undefined)
      {
        throw "Invalid file extension" 
      }
      fs.readFile(req.files.file.path, function (err, data) {
        var newPath =baseUploadPath+uid+extension;
        fs.writeFile(newPath, data, function (err) {
          if(err===null)
          {
            err = "{imageId: "+uid+extension+"}"
          }
          res.jsonp({
          status: err
          });
        });
      });
       
    }
    catch(err)
    {
      res.jsonp({
          status: err
        });
    }
    
   
}
var resize = function(req,res,next) {
  var key = req.input.apikey;
  if(key!=process.env.OPENSHIFT_IMAGES_KEY)
  {
      res.end(key+' is an invalid API key')
  }
  var filename = req.input.filename;
  var height = req.input.height;
  var width = req.input.width;
  var ImagePath = baseUploadPath+filename;
    fs.exists(ImagePath, function (exists) {
      if(!exists)
      {
        res.jsonp({error: "filenotFound"})
      }
      else
      {
         fs.exists(baseUploadPath+path.basename(filename, path.extname(filename))+"-"+height+"-"+width+path.extname(filename), function (exists) {
          if(exists)
          {
            res.sendfile(path.resolve(baseUploadPath+path.basename(filename, path.extname(filename))+"-"+height+"-"+width+path.extname(filename)));
          }
          else
          {
            imageMagick(ImagePath)
            .resize(height, width)
            .write(baseUploadPath+path.basename(filename, path.extname(filename))+"-"+height+"-"+width+path.extname(filename), function (err) {
              if (!err) {res.sendfile(path.resolve(baseUploadPath+path.basename(filename, path.extname(filename))+"-"+height+"-"+width+path.extname(filename)))}
                else
                  {res.jsonp('{"error": "fileNotConverted"}')}
            });
          }
         });
        
      }
    });

}


module.exports = {
  store : store,
  resize : resize
};