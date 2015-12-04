window.onload = function(){

  var h = helpers();
  var els = setEls(["newPrompt", "promptNum", "promptOutput", "reddit", "twitter", "promptPlaque", "apiLink"]);
  placeDefaultWordTypes();
  els.newPrompt.addEventListener("click", loadPrompt);
  loadPrompt();

  function setEls(elIds){
    var els = {};
    h.eachIn(elIds, function(id){
      els[id] = document.getElementById(id);
    });
    return els;
  }

  function placeDefaultWordTypes(){
    var wordTypes = ineedaprompt.default();
    var container = h.el("#wordTypes")
    h.eachIn(wordTypes, function(type, i){
      var choice = document.createElement("LI");
      var input = document.createElement("INPUT");
      var label = document.createElement("LABEL");
      var id = "choice" + i;
      input.type = "checkbox";
      input.value = type;
      input.id = id;
      if(Math.random() > 0.5) input.checked = true;
      label.textContent = type;
      label.htmlFor = id;
      choice.appendChild(input);
      choice.appendChild(label);
      container.appendChild(choice);
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
    h.eachIn = ineedaprompt.helpers.eachIn;
    h.collect = ineedaprompt.helpers.collect;
    return h;
  }

}
