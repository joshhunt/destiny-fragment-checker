var app = require('express')();
var routeCache = require('route-cache')

var getData = require('./getData');
var createHtml = require('./createHtml');

var cache = routeCache.cacheSeconds
var oneMin = 60

app.get('/:platform/:displayName', cache(oneMin), function(req, res) {

    console.log(req.params);

    getData(req.params.displayName, req.params.platform)
        .then(function(data) {
            var page = createHtml.results(data);
            res.send(page)
        })
        .catch(function(err) {
            console.log(err.stack || err);
            var page = createHtml.error();
            res.status(500).send(page)
        })
});

app.listen(process.env.PORT || 7777);