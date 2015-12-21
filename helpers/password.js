var crypto  = require("crypto");

module.exports = (function(){
  var p = {}
  p.fromString = function(string){
    if (!string) return false;
    else return crypto.createHash("md5").update(string).digest("hex");
  }
  return p;
}());
