"use strict";

if(typeof module !== 'undefined') module.exports = helpers();

function helpers(){
  var h = {};
  h.eachIn = function(collection, callback){
    var i, l, value, key, keys;
    if(collection instanceof Number){
      l = collection.length;
    }else{
      if((collection instanceof Array) || (collection instanceof NodeList)){
        keys = collection;
      }else{
        keys = Object.keys(collection);
      }
      l = keys.length;
    }
    for(i = 0; i < l; i++){
      key = (collection instanceof Object) ? i : keys[i];
      value = (collection instanceof Number) ? key : collection[key];
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
  h.commaNum = function(num){
    if(num.toString().length < 4) return num;
    else return num.toString().split("").reverse().join("").replace(/(.{3})/g, "$1,").split("").reverse().join("");
  }
  return h;
}
