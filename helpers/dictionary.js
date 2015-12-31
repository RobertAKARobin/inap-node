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

  d.makePath = function(name, password){
    if(!name || !password) return false;
    name = name.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase().trim();
    password = Password.fromString(password);
    if(!name || !password) return false;
    return name + "-" + password + ".json";
  }

  d.lists = function(json){
    var lists = {};
    h.eachIn(json, function(list, type){
      lists[type] = "- " + list.join("\n- ");
    });
    return lists;
  }

  return d;
}());
