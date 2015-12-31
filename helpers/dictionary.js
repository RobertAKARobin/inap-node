var fs        = require("fs");
var Password  = require("./password");
var INAP      = require("../public/ineedaprompt");
var h         = INAP.helpers;

module.exports = (function(){
  var d = {};
  var directory = "./dictionaries/";

  d.find = function(name, callback){
    var regex = RegExp(name + "-[a-zA-Z0-9]*\.json", "g");
    var correctPath = false, err;
    fs.readdir(directory, function(err, files){
      h.eachIn(files, function(path){
        if(!regex.test(path)) return;
        correctPath = path;
        return "break";
      });
      if(!correctPath) err = {error: true, message: "Dictionary '" + name + "' not found."}
      callback(err, correctPath);
    });
  }

  d.read = function(filename, callback){
    fs.readFile(directory + filename, "utf8", function(err, content){
      callback(err, JSON.parse(content));
    });
  }

  d.write = function(filename, hash, callback){
    var json = JSON.stringify(hash);
    fs.writeFile(directory + filename, json, function(err){
      callback(err, hash);
    });
  }

  d.fromReq = function(req){
    var dictionary = {}
    h.eachIn(INAP.wordTypes, function(type){
      dictionary[type] = h.splitList(req.body[type]);
    });
    return dictionary;
  }

  d.makePath = function(name, password){
    if(!name || !password) return false;
    name = name.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase().trim();
    password = Password.fromString(password);
    if(!name || !password) return false;
    return name + "-" + password + ".json";
  }

  d.mid = {
    getPath: function(req, res, next){
      var dictionary = req.params["name"] || "default";
      d.find(dictionary, function(err, path){
        if(err) return res.json({ success: false, message: err.message });
        res.locals.name = dictionary;
        res.locals.displayName = dictionary;
        req.prompt.name = dictionary;
        req.prompt.path = path;
        next();
      });
    },
    getContents: function(req, res, next){
      var path = req.prompt.path;
      d.read(path, function(err, contents){
        req.prompt.dictionary = contents;
        next();
      });
    }
  }

  return d;
}());
