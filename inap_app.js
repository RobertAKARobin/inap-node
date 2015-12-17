var express = require("express");
var app = express();
var path = require("path");
var fs = require("fs");
var inap = require("./public/ineedaprompt");
var h = inap.helpers;
var dictionary = require("./dictionaries/default.default.json");

(function setStaticServer(){
  var publicPath = path.join(__dirname, "/public");
  var serveStaticMethod = express.static(publicPath);
  app.use(serveStaticMethod);
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
  var rx = RegExp(dictionary + "\.[a-zA-Z0-9]*\.json", "g");
  findFileIn("./dictionaries", rx, function(err, content){
    if(err) return res.json({error: true, message: "Dictionary '" + dictionary + "' not found."});
    res.setHeader("Content-Type", "application/json");
    res.send(content);
  });
});

app.post("/:name", function(req, res){

});

app.get("/:yo", function(req, res){
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

function findFileIn(directory, regex, callback){
  var found = "";
  fs.readdir(directory, function(err, files){
    h.eachIn(files, function(file){
      if(regex.test(file)){
        found = file;
        return "break";
      }
    });
    fs.readFile(directory + "/" + found, "utf8", function(err, content){
      callback(err, content, found);
    });
  });
}
