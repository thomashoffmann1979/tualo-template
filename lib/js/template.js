/*!
 * JavaScript Template
 * Copyright 2015 - tualo solutions GmbH <thomas.hoffmann@tualo.de>
 *
 * ----------------------------------------------------------------
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without
 * limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to
 * whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * <http://opensource.org/licenses/mit-license.php>
 */


if (typeof require==='function'){
  Shunt = require('./shunt');
}

var Template = function(template,ctx){
  if (typeof ctx==='undefined'){
    ctx = new Shunt.Context();
  }
  this.template = template;
  this.startTag = /<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
  this.endTag = /<\/([-A-Za-z0-9_]+)[^>]*>/,
  this.attr = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;
  this.values = /\{((\w+)|(\s+)|(\()|(\))|(-)|(\.)|(\:)|(\=)|(\+)|(\*)|(\[)|(\])|(_]))+\}/gm;
  this.ctx = ctx;
}

/*
function wordwrap( str, width, brk, cut ) {
    brk = brk || 'n';
    width = width || 75;
    cut = cut || false;
    if (!str) { return str; }
    var regex = '.{1,' +width+ '}(\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\S+?(\s|$)');
    return str.match( RegExp(regex, 'g') ).join( brk );
}
*/

Template.prototype.render = function(obj){
  this.result = this.template;
  this.obj = obj;

  for(var prop in obj){
    if (obj.hasOwnProperty(prop)){
      if (
        ( typeof obj[prop] === 'number' ) ||
        ( typeof obj[prop] === 'boolean' ) ||
        ( typeof obj[prop] === 'string' )
      ){
        this.ctx.def(prop,obj[prop]);
      }
    }
  }
  this.foreach();
  this.if();
  this.pureValues();
  return this.result;
}

Template.prototype.escapeRegExp = function(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

Template.prototype.pureValues = function(){
  var matches = (this.result.match(this.values));
  if (matches){
    for(var i=0,m=matches.length;i<m;i++){
      var key = matches[i].substring(1,matches[i].length-1);
      if(
        (typeof this.obj[key]==='string') ||
        (typeof this.obj[key]==='number') ||
        (typeof this.obj[key]==='boolean')
      ){
        this.result = this.result.replace(new RegExp("{"+this.escapeRegExp(key)+"}","gm"), this.obj[key] );
      }else{
        try{
          this.result = this.result.replace(new RegExp("{"+this.escapeRegExp(key)+"}","gm"), Shunt.parse(key, this.ctx) );
        }catch(e){

        }
      }
    }
  }
}

Template.prototype.if = function(){
  var start = true
  while (start){
    start = this.findStartTag('if',this.result);
    if (start){
      var end = this.findCloseTag('if',this.result.substring(start.offset));
      var p1 = this.result.substring(0,start.index);
      var p2 = "";
      var tpl = this.result.substring(start.offset,start.offset+end.index);
      var p3 = this.result.substring(start.offset+tpl.length+end.length);
      var term = start.attributes.term;

      var b = Shunt.parse(term, this.ctx);
      if (b===true){
        p2 += tpl;
      }
      this.result = p1+p2+p3;
    }
  }
}


Template.prototype.foreach = function(){
  var start = true
  while (start){
    start = this.findStartTag('foreach',this.result);
    if (start){
      var end = this.findCloseTag('foreach',this.result.substring(start.offset));
      var p1 = this.result.substring(0,start.index);
      var p2 = "";
      var tpl = this.result.substring(start.offset,start.offset+end.index);
      var p3 = this.result.substring(start.offset+tpl.length+end.length);
      var subTemplate = new Template(tpl,this.ctx);
      var name = start.attributes.item;
      if (typeof this.obj[name]==='object'){
        for(var i=0,m=this.obj[name].length;i<m;i++){
          p2 += subTemplate.render(this.obj[name][i]);
        }
      }
      this.result = p1+p2+p3;
    }
  }
}

Template.prototype.attributes = function(str){
  var result = {};
  var list = str.match(this.attr);
  if (list){
    for(var i=0,m=list.length;i<m;i++){
      var attr = list[i];
      var p = attr.indexOf('=');
      if (p===-1){
        throw new Error('invalid attribute');
      }
      var key = attr.substring(0,p).trim();
      var val = attr.substring(p+1).trim();
      if (
        ( (val.substring(0,1)==='\'') || (val.substring(0,1)==='\"') ) &&
        val.substring(0,1) === val.substring(val.length-1)
      ){
        result[key]=val.substring(1,val.length-1);
      }else{
        throw new Error('invalid attribute');
      }
    }
  }
  return result;
}

Template.prototype.findStartTag = function(tag,str){
  var startpos = str.indexOf('<'+tag);
  var pos = startpos + tag.length + 1;
  var indouble = 0;
  var insingle = 0;
  var c;
  if (startpos<0){
    return null;
  }
  while( ( pos < str.length ) ){
    c = str.charAt(pos);
    if (c==='"'){
      if (indouble===0){
        indouble=1;
      }else{
        indouble=0;
      }
    }else if (c==='\''){
      if (insingle===0){
        insingle=1;
      }else{
        insingle=0;
      }
    }else if(
      (c==='>') &&
      (insingle===0) &&
      (indouble===0)
    ){
      break;
    }
    pos++;
  }
  if (pos < str.length){
    pos++;
    return {
      index: startpos,
      length: pos-startpos,
      offset: pos,
      attributes: this.attributes(str.substring(startpos + tag.length + 1,pos-1))
    }
  }else{
    return null;
  }

}

Template.prototype.findCloseTag = function(tag,str){
  var tags = [];
  var end = str.indexOf('</'+tag+'>');
  if (end===-1){
    throw new Error('missing close tag '+tag);
  }
  var start = this.findStartTag(tag,str);
  if (start){
    if (start.index>end){
      return {
        index: end,
        length: tag.length+3,
        offset: end+tag.length+3
      }
    }
    close = this.findCloseTag(tag,str.substring(start.offset));

    end = str.substring(start.offset+close.offset).indexOf('</'+tag+'>');
    //console.log(close,start.offset+close.offset,str.substring(start.offset+close.offset),sp.indexOf('</'+tag+'>'));
    return {
      index: start.offset + close.offset + end ,
      length: tag.length+3,
      offset: start.offset + close.offset + end + tag.length+3
    }
  }else{
    return {
      index: end,
      length: tag.length+3,
      offset: end+tag.length+3
    }
  }

}


if (typeof module!=='undefined'){
  module.exports = Template ;
}
