var Template = require('../../lib/js/template');

var obj = {
  title: "Some Title",
  text: "abcd",
  list: [
    {
      title: "Item abc",
      text: "xyz"
    },
    {
      title: "Item 2"
    },
    {
      title: "Item 3"
    }
  ]
};
var txt = [];
txt.push("This title *{title}* \n");
txt.push("This text **{ 1 + abs(-3.3) }** \n");
txt.push("<foreach item='list' filter = \"none\">");
  txt.push("Item title {title} \n");
  txt.push("<foreach item=\"sublist\">");
  txt.push("Item title \"{title}\" \n");
  txt.push("</foreach>\n");
  txt.push("... \n");
txt.push("</foreach>\n");
txt.push("<foreach item=\"list\">");
  txt.push("inside the list again\n");
txt.push("</foreach>\n");

var template = new Template(txt.join(""));
var t = template.render(obj);
console.log(t);
/*
var template = new Template("Test {title}");
template.render(obj);
*/
