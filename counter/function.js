var fs = require("fs");
var counter = 0;

function Counter(path, change){
  this.path = path;
  this.change = change ? parseInt(change) : 0;
  this.count = 0;
}
Counter.prototype = {
  load: function(callback){
    var instance = this;
    fs.readFile(instance.path, "utf8", function(err, count){
      instance.count = count ? parseInt(count) : 0;
      callback();
    });
  },
  write: function(callback){
    var instance = this;
    instance.count = instance.count + instance.change;
    fs.writeFile(instance.path, instance.count, function(err){
      if(callback) callback();
    });
  }
}

module.exports = Counter;
