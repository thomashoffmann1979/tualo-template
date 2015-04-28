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

var Template = function(template){
  this.template = template;
  this.startTag = /<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
  this.endTag = /<\/([-A-Za-z0-9_]+)[^>]*>/,
  this.attr = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;
  this.values = /\{((\w+)|(\s+)|(\()|(\))|(-)|(\.)|(\:)|(\=)|(\+)|(\*)|(\[)|(\])|(_]))+\}/gm;
  if (typeof Shunt==='undefined'){
    throw Error('Shunt is missing');
  }
  this.ctx = new Shunt.Context();
  this.ctx.def('abs');
  this.ctx.def('log');
}

Template.prototype.render = function(obj){
  this.result = this.template;
  this.obj = obj;

  for(var prop in obj){
    if (obj.hasOwnProperty(prop)){
      if (
        ( typeof obj[prop] === 'number' ) ||
        ( typeof obj[prop] === 'boolean' )
      ){
        this.ctx.def(prop,obj[prop]);
      }
    }
  }
  this.foreach();
  this.pureValues();
  return this.result;
}

Template.prototype.pureValues = function(){
  var matches = (this.result.match(this.values));
  if (matches){
    for(var i=0,m=matches.length;i<m;i++){
      var key = matches[i].substring(1,matches[i].length-1);
      if(typeof this.obj[key]==='string'){
        this.result = this.result.replace(new RegExp("{"+key+"}","gm"), this.obj[key] );
      }else{
        console.log(key,Shunt.parse(key, this.ctx))
        this.result = this.result.replace(new RegExp("{"+key+"}","gm"), Shunt.parse(key, this.ctx) );
      }
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

      var subTemplate = new Template(tpl);
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
  var start = str.match(this.startTag);
  if (start && start[1]===tag){
    return {
      index: start.index,
      length: start[0].length,
      offset: start.index + start[0].length,
      attributes: this.attributes(start[2])
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
