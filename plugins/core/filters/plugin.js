
ZZLBox.Plugins.Filters = ZZLBox.Plugin.extend({

    _els: [],

    _list: function(filter, type) {

        var b = $('<span />'), v = (zzlbox.router.query[filter.id] || filter['default']);

        $.each(filter.values, function(key, label) {
            $.tmpl('<input name="filter-${id}" ${checked}'
                        + 'type="${type}" id="filter-${id}-${key}" data-key="${key}" />'
                  +'<label for="filter-${id}-${key}" title="${key}">${label}</label>', {
                id: filter.id,
                type: filter.type,
                checked: filter.type == 'checkbox' && v == 'all' || v == key ? 'checked="checked" ' : '',
                key: key,
                label: label
            }).appendTo(b).tipTip();

            /*$('<label><input name="filter-' + filter.id + '" type="' + filter.type + '" ' + checked + 'data-key="' + key + '" />'
                + label + '</label>').appendTo(b);*/
        });

        b.buttonset().change(function(e) {
            var q = {};
            q[filter.id] = $(e.target).data('key');
            zzlbox.router.updateQuery(q);
            return true;
        });

        // fix jquery UI corners bug
        b.children('label').first().removeClass('ui-corner-right').addClass('ui-corner-left');
        b.children('label').last().removeClass('ui-corner-left').addClass('ui-corner-right');

        b.data('updateValue', function(query) {
            var v = query[filter.id] || filter['default'];
            b.children('input').map(function(){
                if($(this).data('key') == v && !this.checked) {
                    this.checked = true;
                    b.data('buttonset').refresh();
                }
            });
        });

        return b;
    },

    _checkbox: function(filter) {
        return this._list(filter);
    },

    _radio: function(filter) {
        return this._list(filter);
    },

    _text: function(filter) {
        var t, func = function() {
            var q = {};
            q[filter.id] = b.children('input').val();
            zzlbox.router.updateQuery(q);
        };
        var b = $('<input type="text" />').keyup(function(e){
            clearTimeout(t);
            if(e.keyCode == $.ui.keyCode.ENTER) {
                func();
                return false;
            } else {
                $('#file-list').children().show();
                if(this.value.length > 0) {
                    $('#file-list .name:not(:contains(' + this.value + '))').parent().hide();
                }
                t = setTimeout(func, 300);
            }
        }).css('width', '100px').searchinput({
            onClear: func
        }).parent();
        b.data('updateValue', function(query) {
            b.find('input').val(query[filter.id] || filter['default']);
            b.find('input').searchinput('refresh');
        });
        return b;
    },

    _num: function(filter) {
        return false;
    },

    _select: function(filter) {
        var b = $('<span />').css('min-width', '70px').button({
            icons: {
                secondary: "ui-icon-triangle-1-s"
            }
        }).click(function() {
            menu.toggle();
            menu.css({position: 'absolute', 'min-width': b.width(), 'z-index': 10})
            menu.position({
                my: 'left top',
                at: 'left bottom',
                of: b,
            });
        }).unbind('mouseup.button').mouseleave(function(){
            menu.is(':visible') && b.addClass('ui-state-active');
        });


        var menu = $('<ul/>').addClass('zzlbox-menu');
        $.each(filter.values, function(key, name){
            $('<li data-key="' + key + '"><a>' + name + '</a></li>').appendTo(menu);
        });

        menu.appendTo(this._toolbar.el).menu({
            selected: function(e, data){
                var q = {};
                q[filter.id] = data.item.data('key');
                zzlbox.router.updateQuery(q);
                return true;
            }
        }).hide();

        menu.data('toggle-button', b);

        // some CSS fix
        menu.children('li').children('a').css({'font-weight': 'normal !important'});

        b.data('updateValue', function(query) {
            b.children('span').filter('.ui-button-text').text(/*filter.name + ': ' + */filter.values[query[filter.id] || filter['default']]);
        });

        b.remove_ = b.remove;
        b.remove = function() {
            menu.remove();
            b.remove_();
        };

        return b;
    },

    _update: function(path, query) {
        $.each(this._els, function(i, el){
            el.data('updateValue')(query || zzlbox.router.query);
        });
    },

    initialize: function() {
        zzlbox.views.Files.bind('change:collection', this.refresh, this);

        zzlbox.router.bind('query:Files', this._update, this);

        zzlbox.plugins.bind('toolbar', this.toolbar, this);
    },

    hidden: [],
    hide: function(name) {
        this.hidden.push(name);
        this._els = $.grep(this._els, _.bind(function(el) {
            if(el.data('filter').id == name) {
                this._toolbar.remove(el, true);
                return false;
            }
            return true;
        }, this));
    },

    refresh: function(model) {

        if(!this._toolbar) return;

        var that = this;

        this._els = $.grep(this._els, function(el) {
            that._toolbar.remove(el, true);
            return false;
        });

        $.each(model.filters, function(id, filter) {
            if($.inArray(id, that.hidden) >= 0 || filter.hidden) return;

            filter.id = id;
            filter.type || (filter.type = 'checkbox');

            var b = that['_' + filter.type](filter);
            if(!b) return;
            b.data('filter', filter);
            that._els.push(b)

            that._toolbar.add(b, filter.name, 10, 'filter');
        });

        this._update();

    },

    toolbar: function(toolbar) {

        //console.log(toolbar);

        this._toolbar = toolbar;

        this.refresh(zzlbox.views.Files.collection);

        return this;
    }

});
