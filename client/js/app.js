App = Ember.Application.create();

App.Router.map(function() {
  // put your routes here
});

App.IndexRoute = Ember.Route.extend({
  model: function() {
    return $.getJSON('/issues.json');
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
        return _.shuffle(this.get('userMap'));
    }.property('userMap'),

    filteredModel: function() {
        var only = this.get('showOnlyUser'),
            model = this.get('model');
        if (!only) return model;

        model = model.map(function(story) { return Em.Object.create(story); });

        model.forEach(function(story) {
            var userTasks = story.tasks.filter(function(task) {
                return task.name === only;
            });
            story.set('tasks', userTasks);
        });

        return model;
    }.property('model', 'showOnlyUser')
});

