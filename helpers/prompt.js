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

  p.typeChoices = function(){
    var choices = [];
    h.eachIn(p.default, function(type){
      var isChecked = (Math.random() > 0.5) ? "checked" : null;
      choices.push({ type: type, checked: isChecked });
    });
    return choices;
  }
  p.checkedTypes = function(choices){
    return h.collect(choices, function(choice){
      if(choice.checked) return choice.type;
    });
  }
  p.wordLists = function(json){
    var lists = {};
    h.eachIn(json, function(list, type){
      lists[type] = "- " + list.join("\n- ");
    });
    return lists;
  }
  p.count = function(){
    return counter.count++;
  }
  p.new = function(dictionary, q){
    var choices = p.typeChoices();
    var query = q || p.checkedTypes(choices);
    return {
      choices: choices,
      lists: p.wordLists(dictionary),
      prompt: new INAP(query, dictionary).english(),
      count: h.commaNum(p.count())
    }
  }
  return p;
}());
