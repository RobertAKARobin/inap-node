var fs = require("fs");
var path = "./tmp/counter.txt";

fs.open(path, "a", function(){});

module.exports = function(callback){
  fs.readFile(path, "utf8", function(err, count){
    if(err) return console.log("Read error: " + err);
    count = count ? (parseInt(count) + 1) : 1;
    fs.writeFile(path, count, function(err){
      if(err) console.log("Write error: " + err);
      else callback(count);
    });
  });
}
