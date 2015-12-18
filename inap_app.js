var express = require("express");
var app = express();
var path = require("path");
var fs = require("fs");
var bodyParser = require("body-parser");
var crypto = require("crypto");
var inap = require("./public/ineedaprompt");
var h = inap.helpers;
var dictionary = require("./dictionaries/default-default.json");

(function setMiddleware(){
  var publicPath = path.join(__dirname, "/public");
  var serveStaticMethod = express.static(publicPath);
  app.use(serveStaticMethod);
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());
}());

var counter;
(function startCounter(){
  var Counter = require("./counter/function.js");
  counter = new Counter("./public/counter.txt");
  counter.load(function(){
    setInterval(counter.write.bind(counter), (3 * 1000));
  });
}());

app.get("/api", function(req, res){
  var wordOrder = [], prompt;
  if(req.query.q) wordOrder = req.query.q.split(" ");
  if(wordOrder.length < 1) wordOrder = inap.default.slice();
  try{
    prompt = new inap(wordOrder, dictionary).english();
  }catch(e){
    return res.json({success: false, error: e});
  }
  counter.count = counter.count + 1;
  res.json({success: true, prompt: prompt, count: counter.count});
});

app.get("/:dictionary.json", function(req, res){
  var dictionary = req.params["dictionary"];
  findDictionary(dictionary, function(err, content){
    if(!content){
      res.json({error: true, message: "Dictionary '" + dictionary + "' not found."});
    }else{
      res.setHeader("Content-Type", "application/json");
      res.send(content);
    }
  });
});

app.post("/dictionary", function(req, res){
  var dictionary = req.body.dictionary.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase().trim();
  var attempt = passwordify(req.body.password);
  if(!dictionary || !attempt) res.redirect("/?err=Missing+name+or+password");
  else findDictionary(req.body.dictionary, function(err, content, path){
    var pass = passFromPath(path), new_dic;
    var filename = dictionary + "-" + attempt + ".json";
    if(pass && attempt !== pass) res.redirect("/" + dictionary + "?err=Bad+password")
    else{
      new_dic = getDictionaryFrom(req);
      fs.writeFile("./dictionaries/" + filename, new_dic, function(err){
        res.redirect("/" + dictionary);
      });
    }
  });
});

app.get("/:any", function(req, res){
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

app.post("/", function(req, res){
  // TODO Save number of times prompt has been generated
  counter.count = counter.count + 1;
  res.json({success: true, count: counter.count});
});

app.listen(3001, function(){
  console.log("All systems go on port 3001.");
});

function findDictionary(dictionary, callback){
  var rx = RegExp(dictionary + "-[a-zA-Z0-9]*\.json", "g");
  var directory = "./dictionaries/";
  findFileIn(directory, rx, function(path){
    if(!path) callback(null, null, path);
    else fs.readFile(directory + path, "utf8", function(err, content){
      callback(err, content, path);
    });
  });
}

function findFileIn(directory, regex, callback){
  var found = "";
  fs.readdir(directory, function(err, files){
    h.eachIn(files, function(file){
      if(regex.test(file)){
        found = file;
        return "break";
      }
    });
    callback(found);
  });
}

function passwordify(string){
  if (!string) return false;
  else return crypto.createHash("md5").update(string).digest("hex");
}

function getDictionaryFrom(req){
  var dictionary = {}
  h.eachIn(inap.wordTypes, function(type){
    dictionary[type] = h.splitList(req.body[type]);
  });
  return JSON.stringify(dictionary);
}

function passFromPath(path){
  if (!path) return false;
  return path.substring(path.lastIndexOf("-") + 1, path.lastIndexOf("."));
}
