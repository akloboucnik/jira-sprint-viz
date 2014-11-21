App = Ember.Application.create();

var Issue = Em.Object.extend({
    cssClass: function() {
        return this.get('status').replace(/ /g, "-").toLowerCase();
    }.property('status'),

    hasSubtasksOfUser: function(user) {
        if (!this.get('tasks.length')) return false;

        return !!this.get('tasks').filter(function(task) {
            return task.get('name') === user;
        }).length;
    },

    filteredSubtasks: function() {
        var only = this.get('showOnlySubtasks'),
            tasks = this.get('tasks').filter(function(t) {
                return t.status !== 'Done' ||
                       t.resolution !== 'invalid';
            });

        if (!only || Em.empty(tasks)) return tasks;

        return tasks.filter(function(task) {
            return task.get('name') === only;
        });
    }.property('showOnlySubtasks')
});

var mapStatusName = function(statusName) {
    switch (statusName) {
        case 'Completed':
            return 'Done';
            break;
        case 'Hacking':
            return 'In Progress';
            break;
        case 'Backlog':
            return 'To Do';
            break;
        case 'Verification':
            return 'In Progress';
            break;
        default:
            return statusName;
            break;
    }
};

var createModelObjectFromPojo = function(obj) {
    var parent = (obj.fields.parent) ? obj.fields.parent['key'] : null,
        res = (obj.fields.resolution) ? obj.fields.resolution.name.toLowerCase() : null;
    return Issue.create({
        id: obj.key,
        raw: obj,
        description: obj.fields.summary,
        name: obj.fields.assignee.name, // change to assignee
        avatarUrl: '/avatar/' + obj.fields.assignee.name,
        status: mapStatusName(obj.fields.status.name),
        resolution: res,
        parent: parent,
        tasks: []
    });
};


var createModelTree = function(data) {
    var parents = data.issues.filter(function(issue) {
        return !issue.fields.parent;
    }).map(createModelObjectFromPojo);

    var children = data.issues.filter(function(issue) {
        return issue.fields.parent;
    }).map(createModelObjectFromPojo);

    // create a tree
    // TODO refactor
    children.forEach(function(child) {
        var parent = parents.findBy('id', child.get('parent'));
        parent.get('tasks').pushObject(child);
    });

    return parents;
};

App.Router.map(function() {
  // put your routes here
});

App.IndexRoute = Ember.Route.extend({
  model: function() {
    return new Em.RSVP.Promise(function(resolve, reject) {
        $.getJSON('/issues.json').then(function(data) {
            var tree = createModelTree(data);
            resolve(tree);
        }, function(err) {
            reject(err);
        });
    });
  }
});

App.IndexController = Em.ObjectController.extend({
    showOnlyUser: null,
    userMap: [
        Em.Object.create({ short: "AKL", name: "adam.kloboucnik", active: false }),
        Em.Object.create({ short: "DKU", name: "david.kubecka", active: false }),
        Em.Object.create({ short: "FA", name: "filip.andres", active: false }),
        Em.Object.create({ short: "JHR", name: "jan.hruban", active: false }),
        Em.Object.create({ short: "JP", name: "jan.pradac", active: false }),
        Em.Object.create({ short: "JPA", name: "jan.papousek", active: false }),
        Em.Object.create({ short: "JS", name: "jiri", active: false }),
        Em.Object.create({ short: "MMI", name: "michelle.michaels", active: false }),
        Em.Object.create({ short: "MSP", name: "miroslav.spousta", active: false }),
        Em.Object.create({ short: "MWE", name: "michal.weiser", active: false }),
        Em.Object.create({ short: "PB", name: "petr.benes", active: false }),
        Em.Object.create({ short: "VRY", name: "vojtech.rylko", active: false })
    ],

    actions: {
        filterUser: function(name) {
            this.set('showOnlyUser', name);
        }
    },

    setActiveUser: function() {
        var only = this.get('showOnlyUser');
        this.get('userMap').forEach(function(u) { u.set('active', false); });
        if (only) {
            this.get('userMap').findBy('name', only).set('active', true);
        }
    }.observes('showOnlyUser'),

    userFilterList: function() {
        var d = new Date();
        d.setHours(0,0,0,0);
        var c = new Chance(+d);
        return c.shuffle(this.get('userMap'));
    }.property('userMap'),

    filteredModel: function() {
        var only = this.get('showOnlyUser'),
            model = this.get('model');

        if (!only) {
            model.map(function(story) { story.set('showOnlySubtasks', null); });
            return model;
        }

        return model.filter(function(story) {
            // display story if:
            //   * has no subtasks and is users
            //   * has some subtasks of user
            return story.get('tasks.length') && story.hasSubtasksOfUser(only) ||
                   story.get('name') === only;
        }).map(function(story) {
            story.set('showOnlySubtasks', only);
            return story;
        });
    }.property('model', 'showOnlyUser')
});

