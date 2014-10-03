var express = require('express');
var app = express();
var JiraApi = require('jira').JiraApi;
var async = require('async');
var serveStatic = require('serve-static');
var serve = serveStatic('client');
var request = require('request');

var SPRINT_ISSUES = "COMMA,SEPARATED,ISSUE,IDS"
    config = {
        host: "jira.intgdc.com",
        port: null,
        user: 'freeipa.user',
        password: 'freeipa.password',
        strictSSL: false,
        verbose: true
    };

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
    getJiraJson(SPRINT_ISSUES, function(err, data) {
        if (err) {
            res.status(400);
        } else {
            var resp = data.map(function(result) {
                if (result.issues.length === 0) return;

                var issue = {
                    id: result.issues[0].fields.parent.key,
                    description: result.issues[0].fields.parent.fields.summary,
                    tasks: result.issues.map(function(issue) {
                        var i = {};
                        i.raw = issue;
                        i.description = issue.fields.summary;
                        i.name = issue.fields.assignee.name;
                        i.avatarUrl = "/avatar/" + i.name;
                        i.status = issue.fields.status.name;
                        i.id = issue.key;
                        i.cssClass = i.status.replace(/ /g, "-").toLowerCase();
                        i.parent = i.raw.fields.parent.key;
                        return i;
                    })
                };
                // first In Progress, then To Do, then Done
                issue.tasks = issue.tasks.sort(function(a, b) {
                    var aVal = (a.status == 'In Progress') ? 1 : (a.status == 'To Do') ? 2 : 3,
                        bVal = (b.status == 'In Progress') ? 1 : (b.status == 'To Do') ? 2 : 3;
                    return aVal - bVal;
                });

                return issue;
            })
            res.send(resp);
        }
    });
});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});

var jira = new JiraApi('https', config.host, config.port, config.user, config.password, 'latest', config.verbose, config.strictSSL);

var getJiraJson = function(issues, callback) {
    var tasks = [];
    issues.split(",").forEach(function(issueNumber) {
        tasks.push(jira.searchJira.bind(jira, "parent=\""+issueNumber+"\"", ["summary", "status", "assignee", "description", "parent"]))
    });

    async.parallel(tasks, callback)
};

