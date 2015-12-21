var express    = require("express");
var app        = express();
var path       = require("path");
var fs         = require("fs");
var bodyParser = require("body-parser");

var INAP       = require("./public/ineedaprompt");
var h          = INAP.helpers;
var Prompt     = require("./helpers/prompt");
var Dictionary = require("./helpers/dictionary");
var Password   = require("./helpers/password");

(function setMiddleware(){
  app.use(express.static(path.join(__dirname, "/public")));
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());
  app.set("view engine", "hbs");
}());

function showError(req, res, message){
  res.locals.prompt = message;
  res.render("index");
}

app.use(function(req, res, next){
  req.prompt = {}
  res.locals.title = req.query["prompt"] || "I Need A Prompt";
  res.locals.description = req.query["prompt"] || "I Need A Prompt: Generate a random sentence using a dictionary you create!"
  next();
});
app.use(function(req, res, next){
  var query = req.query["q"];
  if(query) query = query.split(" ");
  if(!query || query.length < 1) query = Prompt.default.slice();
  req.prompt.query = query;
  next();
});
app.use("/dictionary/:name?", function(req, res, next){
  var dictionary = req.params["name"] || "default";
  Dictionary.find(dictionary, function(err, path){
    if(err) return showError(req, res, err.message);
    req.prompt.name = dictionary;
    req.prompt.path = path;
    next();
  });
});
app.use("/dictionary/:name/:action?", function(req, res, next){
  var path = req.prompt.path;
  Dictionary.read(path, function(err, contents){
    req.prompt.dictionary = contents;
    next();
  });
});

app.get("/", function(req, res){
  Dictionary.find("default", function(err, path){
    Dictionary.read(path, function(err, contents){
      h.extend(res.locals, Prompt.new(contents));
      res.render("index");
    });
  });
});
app.get("/api", function(req, res){
  Dictionary.find("default", function(err, path){
    Dictionary.read(path, function(err, contents){
      var prompt = Prompt.new(contents);
      res.json({success: true, message: prompt.prompt, count: prompt.count});
    });
  });
});
app.get("/dictionary", function(req, res){
  res.redirect("/dictionary/default");
});
app.get("/dictionary/:name", function(req, res){
  h.extend(res.locals, Prompt.new(req.prompt.dictionary));
  res.render("index");
});
app.get("/dictionary/:name/json", function(req, res){
  res.json(req.prompt.dictionary);
});
app.get("/dictionary/:name/prompt", function(req, res){
  try{ var prompt = Prompt.new(req.prompt.dictionary, req.prompt.query);
  }catch(e){ showError(req, res, e.message) }
  res.json({success: true, message: prompt.prompt, count: prompt.count});
});

app.post("/dictionary", function(req, res){
  var name = req.body.dictionary;
  var newPath = Dictionary.makePath(name, req.body.password);
  Dictionary.find(name, function(err, oldPath){
    if(!Dictionary.isMatch(newPath, oldPath)){
      showError(req, res, "Bad password");
    }else Dictionary.write(newPath, Dictionary.fromReq(req), function(){
      res.redirect("/dictionary/" + name);
    });
  });
});
app.post("/count", function(req, res){
  res.json({success: true, count: Prompt.count()});
});

app.listen(3001, function(){
  console.log("All systems go on port 3001.");
});
