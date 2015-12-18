"use strict";

window.onload = function(){

  var v = viewHelpers();
  var h = ineedaprompt.helpers;
  var dictionary = location.pathname.substring(1) || "default";
  var columns = {};
  var els = getEls(["wordTypes", "wordColumns", "newPrompt", "promptNum", "promptOutput", "reddit", "twitter", "promptPlaque", "apiLink", "dictionaryName", "dictionaryForm"]);
  placeDefaultWordTypes();
  els["promptOutput"].addEventListener("click", createPrompt);
  v.ajax("GET", "./" + dictionary + ".json", function(response){
    if(response.error){
      updatePlaque("Dictionary not found.");
    }else{
      if(dictionary !== "default"){
        els["dictionaryName"].value = dictionary;
      }
      placeWordColumns(response);
      createPrompt();
    }
  });

  function getEls(elIds){
    var els = {};
    elIds.forEach(function(id){
      els[id] = document.getElementById(id);
    });
    return els;
  }

  function placeDefaultWordTypes(){
    var template = els["wordTypes"].querySelector("li");
    var types = ineedaprompt.default;
    var out = v.templatify(template, types, function(index, type, el){
      return { type: type, index: index }
    });
    out.forEach(function(el){
      if(Math.random() > 0.5) el.querySelector("input").checked = true;
    });
  }

  function placeWordColumns(dictionary){
    var template = els["wordColumns"].querySelector(".list");
    columns = v.templatify(template, dictionary, function(type, list, el){
      return {type: type, words: "- " + list.join("\n- ")}
    });
  }

  function getDictionary(){
    var dictionary = {}
    var texts = document.querySelector("#wordColumns").querySelectorAll("textarea");
    h.eachIn(texts, function(textarea){
      var type = textarea.getAttribute("data-word-type");
      dictionary[type] = h.splitList(textarea.value);
    });
    return dictionary;
  }

  function createPrompt(){
    var dictionary = getDictionary();
    var wordOrder = v.getChecks("#wordTypes input");
    var prompt = new ineedaprompt(wordOrder, dictionary).english();
    v.ajax("POST", "/", function(response){
      updatePlaque(prompt, response.count);
    });
  }

  function updatePlaque(prompt, count){
    var queryParam = prompt.replace(/ /g, "+");
    els["promptOutput"].textContent = prompt;
    els["promptPlaque"].className = "plaque on";
    if(count){
      els["reddit"].href = reddit(queryParam);
      els["twitter"].href = twitter(queryParam);
      els["promptNum"].textContent = "Prompt #" + count;
      document.body.className = "";
    }else{
      document.body.className = "promptonly";
    }
  }

  function reddit(string){
    return "https://www.reddit.com/r/ineedaprompt/submit?selftext=true&title=" + string;
  }

  function twitter(string){
    return "https://twitter.com/intent/tweet?text=%23ineedaprompt+" + string;
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
    v.templatify = function(template, collection, formatted){
      var container = template.parentElement;
      var output = [], key;
      for(key in collection){
        var el = template.cloneNode(true);
        var input = formatted(key, collection[key], el);
        var elHtml = el.innerHTML;
        Object.keys(input).forEach(function(key){
          var rx = new RegExp("{{"+ key + "}}", "g");
          elHtml = elHtml.replace(rx, input[key] || "");
        });
        el.innerHTML = elHtml;
        output.push(el);
        container.appendChild(el);
      }
      container.removeChild(template);
      return output;
    }
    return v;
  }

}
