
ZZLBox.Router = Backbone.Router.extend({

    // available pages
    // will added by modules
    routes: {},

    history: [],
    view: '',
    query: {},
    chunks: ['#'],  // hack to init change:query on first load

    started: false,

    // start history navigation
    start: function() {
        // capture all router events to load specific pages
        zzlbox.router.bind('all', function(name) {
            name = name.split(':');
            if(name[0] == 'route') {
                // parse query if exists
                var chunks = Array.prototype.slice.call(arguments, 1);
                zzlbox.router.history.push(zzlbox.router.getFragment(true));
                var query = {};
                if(chunks.length > 0) {
                    var q = chunks.pop().split('?');
                    if(q.length > 1) {
                        $(q[1].split('&')).each(function(i, v){
                            v = v.split('=');
                            query[v[0]] = v[1];
                        });
                    }
                    chunks.push(q[0]);
                }

                zzlbox.router.query = query;
                zzlbox.router.chunks = chunks;
                zzlbox.router.trigger('query:' + name[1], chunks, query);

                // trigger view change event
                if(name[1] != '#' && zzlbox.router.view != name[1]) {
                    zzlbox.router.view = name[1];
                    zzlbox.router.trigger('change:view', name[1]);
                }
            }
        });

        this.started = true;
        Backbone.history || (Backbone.history = new Backbone.History);
        Backbone.history.start({pushState: true});
    },

    getFragment: function(full) {
        var f = Backbone.history.getFragment();
        if(!full) {
            f = f.split('?')[0];
        }
        return f;
    },

    formatQuery: function(query) {
        var q = [];
        $.each(query || this.query, function(i, v) {
            q.push(i + '=' + v);
        });
        return q.length > 0 ? ('?' + q.join('&')) : '';
    },

    setQuery: function(query, path) {
        this.updateQuery(query, path, true);
    },

    updateQuery: function(query, path, reset) {

        path = path || Backbone.history.getFragment(), q = {};

        if(!reset) {
            $.each(this.query, function(i, v) {
                q[i] = v;
            });
        }

        $.each(query, function(i, v) {
            q[i] = v;
            if(v == null || v == '') delete q[i];
        });

        this.navigate(path.split('?')[0] + this.formatQuery(q));
    },

    updatePath: function(path) {
        this.navigate(path + this.formatQuery());
    },

    navigate: function(fragment) {
        var hash;
        fragment = fragment.split('#');
        (fragment.length > 1) && (hash = fragment.pop());
        Backbone.history.navigate(fragment.join('#'), true);
        hash && (document.location.hash = hash);
    },

    refresh: function() {
        this.trigger('router-refresh');
        Backbone.history.loadUrl(Backbone.history.fragment);
    },

    add: function(fragment, view, callback) {
        if(typeof fragment == 'object') {
            view = fragment.view;
            callback = fragment.callback;
            fragment = fragment.fragment;
        }
        if(fragment.substr(0, 1) == '#') {
            // redirects
            this.route(fragment.substr(1), '#', function() {
                zzlbox.router.navigate(view);
                callback && callback.apply(this, arguments);
            });
        } else {
            this.route(fragment, view, callback || function(){});
        }
    },

    links: function(node) {
        node = $(node);
        var links = node.find('a');
        node.is('a') && (links = links.add(node));
        links.each(function() {
            $(this).click(function(e) {
                if(e.which == 1) {
                    zzlbox.router.navigate($(this).attr('href').substr(1));
                    return false;
                }
            });
        });
        return node;
    },

    // some hack to prevent code duplication
    _bindRoutes: function() {
        for(var i in this.routes) {
            this[this.routes[i]] = function(){}
        }
        Backbone.Router.prototype._bindRoutes.apply(this);
    }
});

