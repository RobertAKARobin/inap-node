"use strict";

if(typeof module !== 'undefined') module.exports = ineedaprompt;

function ineedaprompt(wordOrder, dictionary){
  var h = ineedaprompt.helpers;
  var instance = this;
  instance.wordOrder = wordOrder || [];
  instance.dictionary = dictionary || {};
}
ineedaprompt.wordTypes = [
  "noun", "adjective", "adverb", "verb", "location"
]
ineedaprompt.default = function(){
  return ["adjective", "adjective", "noun", "adverb", "verb", "adjective", "adjective", "noun", "location"];
}
ineedaprompt.prepositions = ["aboard", "about", "above", "across", "after", "against", "along", "alongside", "amid", "among", "anti", "around", "as", "at", "before", "behind", "below", "beneath", "beside", "besides", "between", "beyond", "but", "by", "concerning", "considering", "despite", "down", "during", "except", "excepting", "excluding", "following", "for", "from", "in", "inside", "into", "like", "minus", "near", "of", "off", "on", "onto", "opposite", "outside", "over", "past", "per", "plus", "regarding", "round", "save", "since", "than", "through", "to", "toward", "towards", "under", "underneath", "unlike", "until", "up", "upon", "versus", "via", "with", "within", "without"];
ineedaprompt.helpers = (function(){
  var h = {};
  h.eachIn = function(collection, callback){
    var i, l, value, key, keys, clazz = collection.constructor.name.toLowerCase();
    if(clazz === "number") l = collection;
    else{
      keys = (clazz === "array") ? collection : Object.keys(collection);
      l = keys.length;
    }
    for(i = 0; i < l; i++){
      key = (clazz === "object") ? keys[i] : i;
      value = (clazz === "number") ? key : collection[key];
      if(callback(value, key, collection) === "break") return key;
    }
    return -1;
  }
  h.findMatchInArray = function(value, comparators){
    var indexOfMatch = h.eachIn(comparators, function(c){
      if(h.hasSubstr(c, value) || h.hasSubstr(value, c)) return "break";
    })
    return comparators[indexOfMatch];
  }
  h.hasSubstr = function(out, inn){
    return(out.toLowerCase().substring(0, inn.length) === inn.toLowerCase());
  }
  h.isIn = function(value, array){
    var isIn = false;
    h.eachIn(array, function(comparator){
      if(value == comparator){ isIn = true; return "break"; }
    });
    return isIn;
  }
  h.randomValue = function(array){
    var l = array.length;
    return array[Math.floor(Math.random() * l)];
  }
  h.collect = function(array, callback){
    var out = [];
    h.eachIn(array, function(item, index){
      var itemOut = callback(item, index);
      if(itemOut !== undefined) out.push(itemOut);
    });
    return out;
  }
  return h;
}());

ineedaprompt.english = (function(){
  var e = {};
  var h = ineedaprompt.helpers;
  var prepStripper = new RegExp("(" + ineedaprompt.prepositions.join("|") + ")$", "i");
  e.isTerminal = function(type){
    return h.isIn(type, ["noun", "verb", "location"]);
  }
  e.getPhraseType = function(type){
    if(h.isIn(type, ["adjective", "noun"])) return "noun";
    if(h.isIn(type, ["adverb", "verb"])) return"verb";
    else return type;
  }
  e.aOrAn = function(word){
    if(/^\s*[aeiou]/i.test(word)) return "an " + word;
    else return "a " + word;
  }
  e.stripPrepositions = function(word){
    return word.trim().replace(prepStripper, "").trim();
  }
  e.oxfordComma = function(words){
    var out = [];
    h.eachIn(words, function(word, i){
      var end = "";
      var curr = word.type;
      var prev = (prev = words[i-1]) ? prev.type : null;
      var next1 = (next1 = words[i+1]) ? next1.type : null;
      var next2 = (next2 = words[i+2]) ? next2.type : null;
      if(curr === prev && curr === next1) end = ",";
      if(curr === next1 && curr === next2) end = ",";
      if(next1 && curr === next1 && curr !== next2) end += " and";
      word.end = end;
      out.push(word);
    });
    return out;
  }
  return e;
}());

ineedaprompt.prototype = (function(){
  var p = {};
  var h = ineedaprompt.helpers;
  var e = ineedaprompt.english;
  p.validateWordTypes = function(){
    var wordOrder = this.wordOrder, allowedWordTypes = ineedaprompt.wordTypes;
    h.eachIn(wordOrder, function(wordType, index){
      var match = h.findMatchInArray(wordType, allowedWordTypes);
      if(!match) throw("Oops! '" + wordType + "' is not an allowed word.");
      else wordOrder[index] = match;
    });
  }
  p.getWordByType = function(type){
    return {
      type: type,
      phrase: e.getPhraseType(type),
      start: "",
      text: h.randomValue(this.dictionary[type]),
      end: ""
    }
  }
  p.populateWords = function(){
    var instance = this, wordOrder = instance.wordOrder;
    h.eachIn(wordOrder, function(type, index){
      wordOrder[index] = instance.getWordByType(type)
    });
  }
  p.noBareModifiers = function(){
    var instance = this, words = instance.wordOrder;
    var out = [], n;
    h.eachIn(words, function(w, i){
      out.push(w);
      if(!e.isTerminal(w.type) && (!(n = words[i+1]) || (w.phrase !== n.phrase))){
        out.push(instance.getWordByType(w.phrase));
      }
    });
    instance.wordOrder = out;
  }
  p.groupPhrases = function(){
    var instance = this, words = instance.wordOrder;
    var output = [], group, next;
    h.eachIn(words, function(w, i){
      if(group) group.words.push(w);
      else group = {type: w.phrase, start: "", words: [w], end: ""};
      if(!(next = words[i+1]) || w.phrase !== next.phrase || e.isTerminal(w.type)){
        output.push(group);
        group = null;
      }
    });
    instance.wordOrder = output;
  }
  p.formatWords = function(){
    var instance = this, phrases = instance.wordOrder;
    h.eachIn(phrases, function(p, i){
      var next = (next = phrases[i+1]) ? next.type : null;
      p.english = h.collect(e.oxfordComma(p.words), function(w){
        return w.text + w.end;
      }).join(" ");
      if(next && p.type === "location") p.english += ", and";
      if(p.type === "verb" && (next !== "noun")){
        p.english = e.stripPrepositions(p.english);
      }
      if(p.type === "noun"){
        p.english = e.aOrAn(p.english);
        if(next === "verb") p.english += " who is";
      }
    });
  }
  p.formatPhrases = function(){
    var instance = this, phrases = e.oxfordComma(instance.wordOrder), next;
    instance.english = h.collect(phrases, function(p, i){
      return p.english + p.end;
    }).join(" ");
  }
  p.english = function(){
    var instance = this;
    instance.validateWordTypes();
    instance.populateWords();
    instance.noBareModifiers();
    instance.groupPhrases();
    instance.formatWords();
    instance.formatPhrases();
    instance.english = instance.english.replace(/\s+/g," ").replace(/\s,/g,",");
    instance.english = instance.english.charAt(0).toUpperCase() + instance.english.substring(1) + ".";
    return instance.english;
  }
  return p;
}());
