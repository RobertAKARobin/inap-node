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
  app.use(Prompt.mid.setDefaults);
  app.use(Prompt.mid.parseQuery);
  app.use("/api", Dictionary.mid.getPath);
  app.use("/api", Dictionary.mid.getContents);
  app.use("/dictionary/:name?", Dictionary.mid.getPath);
  app.use("/dictionary/:name/:json?", Dictionary.mid.getContents);
}());

function showError(res, message){
  res.locals.prompt = message;
  res.locals.name = "";
  res.render("index");
}

function errorJSON(res, message){
  res.json({
    success: false,
    message: message
  })
}

function promptJSON(res, prompt){
  res.json({
    success: true,
    dictionaryURL: "http://" + res.req.headers.host + "/dictionary/" + res.locals.name + "/json",
    githubURL: "https://github.com/robertakarobin/inap-node",
    prompt: prompt.prompt,
    count: prompt.count,
    components: prompt.obj.wordOrder
  });
}

app.get("/", function(req, res){
  Dictionary.find("default", function(err, path){
    Dictionary.read(path, function(err, contents){
      h.extend(res.locals, Prompt.new(contents));
      res.locals.name = "default";
      res.locals.displayName = "";
      res.render("index");
    });
  });
});
app.get("/api", function(req, res){
  try{ var prompt = Prompt.new(req.prompt.dictionary, req.prompt.query);
  }catch(e){ return errorJSON(res, e); }
  promptJSON(res, prompt);
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
  }catch(e){ return errorJSON(res, e); }
  promptJSON(res, prompt);
});
app.get("/dictionary/:name/:prompt", function(req, res){
  res.locals.title = req.params["prompt"];
  res.locals.prompt = req.params["prompt"];
  res.locals.lists = Prompt.wordLists(req.prompt.dictionary);
  res.render("index");
});

app.post("/dictionary", function(req, res){
  var name = req.body.dictionary;
  var newPath = Dictionary.makePath(name, req.body.password);
  Dictionary.find(name, function(err, existingPath){
    if((newPath && !existingPath) || newPath === existingPath){
      Dictionary.write(newPath, Dictionary.fromReq(req), function(){
        res.redirect("/dictionary/" + name);
      });
    }else showError(res, "Bad password");
  });
});
app.get("/count", function(req, res){
  res.json({success: true, count: Prompt.getCount()});
});
app.post("/count", function(req, res){
  res.json({success: true, count: Prompt.count()});
});

app.listen(3001, function(){
  console.log("All systems go on port 3001.");
});
