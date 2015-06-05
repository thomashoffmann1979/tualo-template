## TEMPLATE
Template is a simple templating engine for objects.

# Usage

  var Template = require('tualo-template');
  var obj = {
    title: "MyTitle",
    list: [
      {
        title: "Item 1",
      },
      {
        title: "Item 2"
      },
      {
        title: "Item 3"
      }
    ]
  };
  var template = new Template('{title}\n<foreach item="list">\t*{title}\n</foreach>');
  var output = template.render(obj);
