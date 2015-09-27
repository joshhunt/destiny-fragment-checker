var fs = require('fs');
var getData = require('./getData');
var createHtml = require('./createHtml');

getData('thisjoshthat', 'xbox')
    .then(function(data) {
        var page = createHtml(data);
        fs.writeFileSync('output.html', page);
    })