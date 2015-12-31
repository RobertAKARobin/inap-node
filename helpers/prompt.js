var Counter = require("./counter");
var INAP = require("../public/ineedaprompt");
var h = INAP.helpers;

var counter;
(function startCounter(){
  counter = new Counter("./public/counter.txt");
  counter.load(function(){
    setInterval(counter.write.bind(counter), (10 * 1000));
  });
}());

module.exports = (function(){
  var p = {};

  p.default = INAP.default;

  p.choices = ["adjective", "adjective", "noun", "adverb", "verb", "adjective", "adjective", "noun", "location"];
  
  p.count = function(){
    return counter.count++;
  }
  p.getCount = function(){
    return counter.count;
  }
  p.getWordChoices = function(query){
    var choices = [];
    var indexes = h.indexesOf(query, p.choices);
    h.eachIn(p.choices, function(choice, i){
      var checked = (indexes.indexOf(i) > -1) ? "checked" : "";
      choices[i] = {type: choice, checked: checked}
    });
    return choices;
  }
  p.parseQueryString = function(string){
    var query = (string ? string.split(" ") : []);
    h.eachIn(query, function(item, i){
      var match = h.findMatchInArray(item, INAP.wordTypes);
      if(!match) query.splice(i, 1);
      else query[i] = match;
    });
    return (query.length < 1) ? h.sample(p.choices) : query;
  }
  return p;
}());
