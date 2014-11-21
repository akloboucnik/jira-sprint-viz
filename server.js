var express     = require('express'),
    app         = express(),
    JiraApi     = require('jira').JiraApi,
    async       = require('async'),
    serveStatic = require('serve-static'),
    serve       = serveStatic('client'),
    request     = require('request'),
    fs          = require('fs'),
    config      = (JSON.parse(fs.readFileSync('.jirarc', 'utf8')));

if (!config.sprintId) {
    console.error('Missing sprint ID! Run example: npm start 171');
    return false;
}

app.use(serve);

app.get('/avatar/:user', function(req, res) {
    var login = req.params.user;
    request.get({
        uri: 'https://jira.intgdc.com/secure/useravatar?ownerId=' + login,
        strictSSL: false,
        auth: {
            user: config.user,
            pass: config.password
        }
    }, function(error, response, body) {
        if (error) res.status(404).end();
    }).pipe(res);
});

app.get('/issues.json', function(req, res){
    getFullJiraJson(config.sprintId, function(err, data) {
        if (err) {
            res.status(400);
        } else {
            res.send(data);
        }
    });
});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});

var jira = new JiraApi('https', config.host, config.port, config.user, config.password, 'latest', config.verbose, config.strictSSL);

var getFullJiraJson = function(sprintId, callback) {
    // TODO add dates
    jira.searchJira('sprint='+config.sprintId, { maxResults: 100, fields: ['summary', 'status', 'resolution', 'issuetype', 'assignee', 'parent', 'update'] }, callback);
};

