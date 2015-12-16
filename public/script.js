"use strict";

window.onload = function(){

  var h = helpers();
  var els = getEls(["wordTypes", "wordColumns", "newPrompt", "promptNum", "promptOutput", "reddit", "twitter", "promptPlaque", "apiLink"]);
  placeDefaultWordTypes();
  els.newPrompt.addEventListener("click", loadPrompt);
  loadPrompt();
  placeWordColumns();

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
    var out = h.templatify(template, types, function(index, type, el){
      return { type: type, index: index }
    });
    out.forEach(function(el){
      if(Math.random() > 0.5) el.querySelector("input").checked = true;
    });
  }

  function placeWordColumns(){
    h.ajax("dictionary.json", function(dictionary){
      var template = els["wordColumns"].querySelector("div");
      h.templatify(template, dictionary, function(type, list, el){
        return {type: type, words: "- " + list.join("\n- ")}
      })
    });
  }

  function loadPrompt(){
    var wordOrder = h.getChecks("form input");
    var promptUrl = "/api?q=" + wordOrder.join("+");
    els.apiLink.href = promptUrl;
    h.ajax(promptUrl, placePrompt);
  }

  function placePrompt(apiResponse){
    var plaque = els.promptPlaque;
    var queryParam = apiResponse.prompt.replace(/ /g, "+");
    els.promptNum.textContent = h.commaNum(apiResponse.count);
    els.promptOutput.textContent = apiResponse.prompt;
    els.reddit.href = "https://www.reddit.com/r/ineedaprompt/submit?selftext=true&title=" + queryParam;
    els.twitter.href = "https://twitter.com/intent/tweet?text=%23ineedaprompt%20" + queryParam;
    plaque.className = "plaque on";
  }

  function helpers(){
    var h = {};
    h.el = function(str){
      var e = {}, d = document;
      if(str.charAt(0) === "#") e = d.getElementById(str.substring(1));
      else e = d.querySelectorAll(str);
      if(e instanceof NodeList && e.length === 1) e = e[0];
      return e;
    }
    h.ajax = function(path, callback){
      var http = new XMLHttpRequest();
      http.open("GET", path, true);
      http.onreadystatechange = function(){
        if(this.readyState !== 4 || this.status !== 200) return;
        callback(JSON.parse(this.responseText));
      }
      http.send();
    }
    h.commaNum = function(num){
      if(num.toString().length < 4) return num;
      else return num.toString().split("").reverse().join("").replace(/(.{3})/g, "$1,").split("").reverse().join("");
    }
    h.getChecks = function(selector){
      var inputs = h.el(selector);
      return h.collect(inputs, function(input){
        if(input.checked) return input.value;
      });
    }
    h.templatify = function(template, collection, formatted){
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
    h.collect = ineedaprompt.helpers.collect;
    return h;
  }

}
