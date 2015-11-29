var express = require("express");
var app = express();
var path = require("path");
var inap = require("./public/ineedaprompt");
var dictionary = require("./public/dictionary");

(function setStaticServer(){
  var publicPath = path.join(__dirname, "/public");
  var serveStaticMethod = express.static(publicPath);
  app.use(serveStaticMethod);
}());

app.get("/", function(req, res){
  res.sendFile("index.html");
});

app.get("/api", function(req, res){
  var wordOrder = [];
  if(req.query.q) wordOrder = req.query.q.split(" ");
  if(wordOrder.length < 1) wordOrder = inap.default();
  try{
    var prompt = new inap(wordOrder, dictionary).english();
  }catch(e){
    return res.json({success: false, error: e});
  }
  return res.json({success: true, prompt: prompt});
});

app.listen(3000, function(){
  console.log("All systems go on port 3000.");
});
