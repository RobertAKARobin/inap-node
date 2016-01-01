"use strict";

window.onload = function(){

  var v = viewHelpers();
  var h = ineedaprompt.helpers;
  var els = getEls(["wordTypes", "jsonLink", "wordColumns", "newPrompt", "promptNum", "promptNext", "promptOutput", "reddit", "twitter", "facebook", "permalink", "promptPlaque", "apiLink", "dictionaryName", "dictionaryForm"]);
  var dictionaryName = els["dictionaryName"].value;
  var columns = getColumns();
  var dictionary = getDictionary();

  updatePlaque(els["promptOutput"].textContent);
  if(els["promptNext"]) els["promptNext"].addEventListener("click", createPrompt);

  function getEls(elIds){
    var els = {};
    h.eachIn(elIds, function(id){
      els[id] = document.getElementById(id);
    });
    return els;
  }

  function getColumns(){
    var columns = (columns || []);
    h.eachIn(document.querySelectorAll("#wordColumns textarea"), function(el){
      columns.push(el);
      el.addEventListener("input", function(){
        this.setAttribute("data-tainted", "true");
      });
    });
    return columns;
  }

  function getDictionary(){
    var d = (dictionary || {});
    h.eachIn(columns, function(textarea){
      var type = textarea.name;
      if(!d[type] || textarea.hasAttribute("data-tainted")){
        d[type] = h.splitList(textarea.value);
        textarea.removeAttribute("data-tainted");
      }
    });
    return d;
  }

  function createPrompt(){
    var dictionary = getDictionary();
    var wordOrder = v.getChecks("#wordTypes input");
    var prompt = new ineedaprompt(wordOrder, dictionary).english();
    v.ajax("POST", "/count", function(response){
      updatePlaque(prompt, response.count);
    });
  }

  function updatePlaque(prompt, count){
    var queryParam = prompt.replace(/ /g, "+");
    els["promptOutput"].textContent = prompt;
    els["reddit"].href = reddit(queryParam);
    els["twitter"].href = twitter(queryParam);
    els["facebook"].href = facebook(prompt);
    els["permalink"].href = permalink(prompt);
    if(count) els["promptNum"].textContent = h.commaNum(count);
  }

  function reddit(string){
    return "https://www.reddit.com/r/ineedaprompt/submit?selftext=true&title=" + string;
  }

  function twitter(string){
    return "https://twitter.com/intent/tweet?text=%23ineedaprompt+" + string;
  }

  function permalink(string){
    return "http://ineedaprompt.com/dictionary/" + dictionaryName + "/" + encodeURI(string);
  }

  function facebook(string){
    return "https://www.facebook.com/sharer/sharer.php?u=" + permalink(string);
  }

  function viewHelpers(){
    var v = {};
    v.el = function(str){
      var e = {}, d = document;
      if(str.charAt(0) === "#" && !(/\s/g.test(str))){
        e = d.getElementById(str.substring(1));
      }
      else e = d.querySelectorAll(str);
      if(e instanceof NodeList && e.length === 1) e = e[0];
      return e;
    }
    v.ajax = function(method, path, callback){
      var http = new XMLHttpRequest();
      http.open(method, path, true);
      http.onreadystatechange = function(){
        if(this.readyState !== 4 || this.status !== 200) return;
        callback(JSON.parse(this.responseText));
      }
      http.send();
    }
    v.getChecks = function(selector){
      var inputs = v.el(selector);
      return h.collect(inputs, function(input){
        if(input.checked) return input.value;
      });
    }
    return v;
  }

}
