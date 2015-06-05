var fs = require('fs');

var Shunt = require('../../lib/js/shunt');
var Template = require('../../lib/js/template');
var json = require('./html-css.json');
var htmltemplate = (fs.readFileSync(__dirname+'/html-css.html')).toString('utf8');


var ctx = new Shunt.Context();
ctx.def('compare',function(a,b){
  return a===b;
});

var template = new Template(htmltemplate,ctx);


var t = template.render(json);
console.log(t);
