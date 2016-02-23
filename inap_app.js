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
  app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.locals = {
      url:        req.headers.host + req.url,
      title:      "I Need A Prompt",
      description:"I Need A Prompt: Generate a random sentence using a dictionary you create!"
    }
    next();
  });
}());

function isHTML(req, res, next){ req.isHTML = true; next(); }
function isJSON(req, res, next){ req.isJSON = true; next(); }
function errify(res, message){
  if(res.req.isHTML){
    res.locals.prompt = message;
    res.render("index");
  }else{
    res.json({success: false, message: message});
  }
}

Prompt.load = function(req, res, next){
  var query   = Prompt.parseQueryString(req.query["q"]);
  var obj     = new INAP(query.slice(), req.dictionary.contents);
  req.prompt  = {
    query:      query,
    english:    obj.english(),
    components: obj.wordOrder,
    count:      Prompt.countOne()
  }
  next();
}
Prompt.renderHTML = function(req, res, next){
  var lists = []
  res.locals.prompt = req.prompt.english,
  res.locals.count  = h.commaNum(req.prompt.count),
  res.locals.choices= Prompt.getWordChoices(req.prompt.query)
  res.render("index");
}
Dictionary.load = function(req, res, next){
  var dictionary = {name: (req.params["name"] || "default")}
  dictionary.isDefault = (dictionary.name === "default");
  Dictionary.find(dictionary.name, function(err, path){
    if(err) return errify(res, err.message);
    dictionary.path = path;
    dictionary.display = (dictionary.isDefault ? "" : dictionary.name);
    Dictionary.read(path, function(err, contents){
      dictionary.contents   = contents;
      req.dictionary        = dictionary;
      res.locals.lists      = Dictionary.lists(req.dictionary.contents);
      res.locals.name       = req.dictionary.name;
      res.locals.displayName= req.dictionary.display;
      res.locals.isDefault  = dictionary.isDefault;
      next();
    });
  });
}

app.get("/count", function(req, res){
  res.json({success: true, count: Prompt.getCount()});
});
app.post("/count", function(req, res){
  res.json({success: true, count: Prompt.countOne()});
});

app.get("/",
  isHTML, Dictionary.load, Prompt.load, Prompt.renderHTML);
app.get("/dictionary/:name",
  isHTML, Dictionary.load, Prompt.load, Prompt.renderHTML);
app.get("/api",
  isJSON, Dictionary.load, Prompt.load, function(req, res){
    res.json(req.prompt);
  });
app.get("/dictionary/:name/prompt",
  isJSON, Dictionary.load, Prompt.load, function(req, res){
    req.prompt.dictionaryURL = "http://" + req.headers.host + "/dictionary/" + req.dictionary.name + "/json";
    res.json(req.prompt);
  });
app.get("/dictionary/:name/json",
  isJSON, Dictionary.load, function(req, res){
    res.json(req.dictionary.contents);
  });
app.get("/dictionary/:name/:prompt",
  isHTML, Dictionary.load, function(req, res){
    res.locals.title  = req.params["prompt"];
    res.locals.prompt = req.params["prompt"];
    res.locals.count  = h.commaNum(Prompt.getCount());
    res.locals.choices= Prompt.getWordChoices(Prompt.parseQueryString());
    res.render("index");
  });

app.post("/dictionary", isHTML, function(req, res){
  var name = req.body.dictionary;
  var newPath = Dictionary.makePath(name, req.body.password);
  Dictionary.find(name, function(err, existingPath){
    if((newPath && !existingPath) || newPath === existingPath){
      var dictionary = {}
      h.eachIn(INAP.wordTypes, function(type){
        dictionary[type] = h.splitList(req.body[type]);
      });
      Dictionary.write(newPath, dictionary, function(){
        res.redirect("/dictionary/" + name);
      });
    }else errify(res, "Bad password");
  });
});

app.listen(3001, function(){
  console.log("All systems go on port 3001.");
});
