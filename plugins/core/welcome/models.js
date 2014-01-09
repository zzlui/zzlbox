
// User Model
ZZLBox.Models.User = ZZLBox.Model.extend({

    defaults: {
        auth: null,
        login: 'anonymous',
        email: 'test@example.com',
        type: 'free',
        options: {}
    },

    initialize: function() {
        this.fetch();
    },

    logout: function() {
        $.post('/api/login/logout', {}, function(data){
            $.cookie('_ul', null);
            document.location = '/';
        }, 'JSON')
    },

    hasFlag: function(name) {
        return $.inArray(name, this.get('flags')) >= 0;
    },

    // getter/setter
    // use for plugins settings
    option: function(name, value, callback, doNotPush) {
        var that = this;
        if(value == undefined) {
            return this.get('options')[name];
        } else {
            this.get('options')[name] = value;
            if(!doNotPush) {
                $.post('/api/account/save_prefs', {
                    prefs_json: JSON.stringify(this.get('options'))
                }, function(data){
                    that.trigger('change:option:' + name, value);
                    callback && callback(data);
                }, 'json');
            } else {
                that.trigger('change:option:' + name, value);
            }
        }
    },

    reset: function(callback) {
        $.cookie('_zt', null);
        $.post('/api/account/save_prefs', {
            prefs_json: ''
        }, function(data) {
            callback(data);
        }, 'json');
    },

    _read: function(o) {
        // get cookies
        var ul = $.cookie('_ul'), that = this;
        // if we have cookies then fetch info from server
        if( ul ) {
            $.get('/api/account/info', {}, function(data) {
                if(data.status == 'ok') {
                    var options = data.user.prefs_json.length > 0 ? JSON.parse($("<div/>").html(data.user.prefs_json).text()) : {};
                    options.plugins || (options.plugins = _.without(ZZLBox.Plugins.AvailableList, ['metasearch', 'status-navigation']));
                    var flags = data.user.prefs_flags.split(',');
                    o.success(_.extend(data.user, {
                        id: ul,
                        type: data.premium ? 'premium' : 'free',
                        premium: data.premium,
                        options: options,
                        flags: flags,
                        auth: true,
                    }));
                } else {
                    that.set({auth: false});
                    o.error('auth failed');
                }
            }, 'json')
        } else {
            this.set({auth: false});
            o.error('auth failed');
        }
    }/*,
    // TODO
    _update: function() {
        console.log(arguments, this.changedAttributes());
    }*/
});

