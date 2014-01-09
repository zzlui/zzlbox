
ZZLBox.Plugins.Labels = ZZLBox.Plugin.extend({

    presets: [
        /* Google (gmail) colors */
        {color: '464646', bg: 'E7E7E7'},
        {color: '0D3472', bg: 'B6CFF5'},
        {color: '0D3B44', bg: '98D7E4'},
        {color: '3D188E', bg: 'E3D7FF'},
        {color: '711A36', bg: 'FBD3E0'},
        {color: '8A1C0A', bg: 'F2B2A8'},

        {color: 'FFFFFF', bg: 'C2C2C2'},
        {color: 'FFFFFF', bg: '4986E7'},
        {color: 'FFFFFF', bg: '2DA2BB'},
        {color: 'FFFFFF', bg: 'B99AFF'},
        {color: '994A64', bg: 'F691B2'},
        {color: 'FFFFFF', bg: 'FB4C2F'},

        {color: '7A2E0B', bg: 'FFC8AF'},
        {color: '7A4706', bg: 'FFDEB5'},
        {color: '594C05', bg: 'FBE983'},
        {color: '684E07', bg: 'FDEDC1'},
        {color: '0B4F30', bg: 'B3EFD3'},
        {color: '04502E', bg: 'A2DCC1'},

        {color: 'FFFFFF', bg: 'FF7537'},
        {color: 'FFFFFF', bg: 'FFAD46'},
        {color: '662E37', bg: 'EBDBDE'},
        {color: 'FFFFFF', bg: 'CCA6AC'},
        {color: '094228', bg: '42D692'},
        {color: 'FFFFFF', bg: '16A765'},

        /* Some our presets */
        /*{color: 'FFFFFF', bg: '0088FF'},*/
        {color: '222222', bg: '22FF66'},
        {color: '000000', bg: 'FFFFFF'},
        /*{color: '990090', bg: 'FFFF88'},*/
        {color: 'FFFFFF', bg: 'FF8800'},
        {color: 'FFFFFF', bg: '8800FF'},
        {color: '990090', bg: 'FFFF00'},
        {color: 'FFF0F0', bg: 'FF3311'},

        // user specified
        {color: '000000', bg: 'FFFFFF'}
    ],

    initialize: function() {
        var that = this;

        ////////////////
        // NAVIGATION //
        ////////////////
        this.expandedLabels = [];
        zzlbox.plugins.bind('navigation', this.panelNav, this);

        // change active item in navigation
        zzlbox.router.bind('query:Files', this.navActive, this);

        ////////////
        // LABELS //
        ////////////
        // labels menu
        zzlbox.plugins.bind('toolbar', this.toolbarLabels, this);

        // monitor labels change
        zzlbox.views.Files.bind('change:collection', this.changeCollection, this);
        this.changeCollection(zzlbox.views.Files.collection);

        // remove filter id_label from toolbar
        zzlbox.plugins.wait('Filters', function(){
            this.hide('id_labels');
        });

        zzlbox.plugins.bind('files-add-one', this.updateFileList, this);

        this._display = '.name';
        zzlbox.plugins.wait('display-type', function() {
            this.bind('change:display', function(display) {
                this._display = display == 'list' ? '.main' : '.name';
                $('.labels').each(function() {
                    $(this).appendTo($(this).closest('.file').find(that._display));
                })
            }, that);
        });
    },

    changeCollection: function(collection, old) {
        old && old.unbind('change:labels', this.updateLabels);
        collection.bind('change:labels', this.updateLabels, this);
        collection.bind('change:id_labels', function(model) {
            this.updateFileList(zzlbox.views.Files.getItemByModel(model), model);
        }, this);
        this.updateLabels(collection.labels, collection.labelsById);
        this.collection = collection;
    },

    updateLabels: function(labels, labelsById) {
        this.labels = labels ? $.each(labels, function(i, label){
            label.bg || (label.bg = 'FFFFFF');
            label.color || (label.color = '000000');
            return label;
        }) : labels;
        this.labelsById = labelsById;
        labels && this.navElement && this.renderNav();
        this.labelsButton && this.labelsButton.parent().toggle(!!labels);
        this.navElement && this.navElement.toggle(!!labels);
    },

    ///////////////
    // FILE-LIST //
    ///////////////
    updateFileList: function(item, model) {
        if(model.collection.labels === false) {
            return;
        }

        file = model.toJSON();
        var n = item.find('span.labels');
        if(!n.length) {
            n = $('<span class="labels" />').appendTo(item.find(this._display));
            $(document.createTextNode(' ')).insertBefore(n);
        } else {
            $(n).empty();
        }

        var that = this,
            path = function(id) {
                if(id == 0) return [id];
                var p = path(that.labelsById[id].id_labels);
                p.push(id);
                return p;
            },
            ids = file.id_labels.sort(function(a, b) {
                var pa = path(a), pb = path(b);
                while(pa.length && pb.length && pa[0] == pb[0]) {
                    pa.shift(); pb.shift();
                }
                if(pa.length == 0) { return -1; }
                if(pb.length == 0) { return +1; }
                return parseInt(that.labelsById[pa[0]].sorder) < parseInt(that.labelsById[pb[0]].sorder) ? -1 : 1;
            });

        this.labels && file.id_labels.length && $.each(ids, _.bind(function(i, id){
            if(zzlbox.router.query.id_labels == id) {
                return;
            }
            var label = this.labelsById[id];
            $('<span />')
                .addClass('label-item label-item-' + label.id)
                .text(label.name)
                .css({
                    color: '#' + label.color,
                    background: '#' + label.bg,
                })
                .click(function(){
                    zzlbox.router.setQuery({id_labels: id});
                    return false;
                })
                .appendTo(n);
        }, this)) || n.html('&nbsp;');
    },

    ////////////////
    // NAVIGATION //
    ////////////////

    navActive: function(path, query) {
        if(!this.navElement) return;
        query.id_labels && this.labels && this.nav.setState('labels', this.labelsById[query.id_labels].name);
        this.navElement.find('li').each(function(el){
            $(this).children('a').removeClass('active');
            if($(this).data('label').id == query.id_labels) {
                $(this).children('a').addClass('active');
                // expand parents tree items
                var toggler = $('.labels-tree-nav').data('toggler');
                toggler && $(this).parentsUntil('.treeview', 'li.expandable').each(function() {
                    toggler.apply($(this).children('.hitarea').get(0));
                });
            }
        });
    },

    renderNav: function() {
        this.navElement.empty();
        this.labels.length && $('<div />')
                                .text(__('lbl.labels'))
                                .appendTo(this.navElement)
                                .addClass('navigation-item-group-label');

        var that = this, sops = {
            connectWith: '.sortableConnected',
            //distance: 15,
            update: function(e, ui) {
                if(!ui.sender) {
                    var p = ui.item.closest('li.collapsable', '.treeview').data('label'),
                        pid = p ? p.id : '0',
                        label = ui.item.data('label'),
                        prev = ui.item.parent().children(':eq(' + (ui.item.index()-1) + ')').data('label'),
                        sorder = prev ? parseInt(prev.sorder) : 0,
                        nextItems = ui.item.parent().children(':gt(' + ui.item.index() + ')');

                    // update sorders for all next items
                    nextItems.each(function(i) {
                        var label = $(this).data('label');
                        label.sorder = "" + (sorder + i + 2);
                        var lbl = _.clone(label);
                        delete lbl.childs;
                        $.post('/api/label/upsert', lbl);
                    });

                    // update sorder and parent for current item
                    //if(label.id_labels != pid) {
                        // change parent
                    var oldP = label.id_labels;
                    label.id_labels = pid;
                    label.sorder = "" + (sorder + 1);
                    var lbl = _.clone(label);
                    delete lbl.childs;
                    $.post('/api/label/upsert', lbl, function(data) {
                        if(pid != oldP) {
                            // move label to new parent
                            if(oldP == 0) {
                                that.labels = $.grep(that.labels, function(l) {
                                    return !(l.id == label.id);
                                });
                            } else {
                                that.labelsById[oldP].childs = $.grep(that.labelsById[oldP].childs, function(l) {
                                    return !(l.id == label.id);
                                });
                                if(that.labelsById[oldP].childs.length == 0) {
                                    delete that.labelsById[oldP].childs;
                                }
                            }
                            if(pid == 0) {
                                that.labels.push(label);
                            } else {
                                (that.labelsById[pid].childs ||
                                    (that.labelsById[pid].childs = [])).push(label);
                            }
                        }
                        // sort labels
                        var sfunc = function(a, b) {
                            return a.sorder - b.sorder;
                        };
                        if(label.id_labels == 0) {
                            that.labels = that.labels.sort(sfunc);
                        } else {
                            that.labelsById[label.id_labels].childs =
                                that.labelsById[label.id_labels].childs.sort(sfunc);
                        }
                    });
                }
            }
        };

        this
            ._tree()
            .addClass('sortableConnected')
            .sortable(sops)
                .find('ul')
                .addClass('sortableConnected')
                .sortable(sops)
                .end()
            .sortable()
            .appendTo(this.navElement);

        this.navActive(zzlbox.router.chunks, zzlbox.router.query);

        this.navLabelMenu || this.renderNavLabelMenu();
    },

    // create nav label menu
    renderNavLabelMenu: function() {
        this.navLabelMenu = $('<div />').hide()
            .addClass('ui-widget ui-widget-content ui-dialog zzlbox-menu navigation-label-menu')
            .appendTo('body');

        $('<b />').text(__('lbl.name') + ':').appendTo(this.navLabelMenu);
        $('<input id="label-name" />').css('display', 'block').appendTo(this.navLabelMenu).keyup(function(){
            $('#label-label').text($(this).val());
        });

        $('<b />').text(__('lbl.colors') + ':').appendTo(this.navLabelMenu);

        var colors = $('<div class="colors" />').appendTo(this.navLabelMenu);
        $.each(this.presets, _.bind(function(i, p){
            p.el = $('<span />').text('a')
            .addClass('label-item')
            .css({
                color: '#' + p.color,
                background: '#' + p.bg,
            }).appendTo(colors).click(_.bind(function(){
                this.setActiveColorSet(p.el);
            }, this)).data('preset', p);
            i == this.presets.length - 1 && p.el.hide()
        }, this));

        $('<b />').text(__('lbl.under') + ':').appendTo(this.navLabelMenu);

        $('<div><select id="label-parent" /></div>').appendTo(this.navLabelMenu).children();

        $('<span />').text(__('lbl.save')).appendTo(this.navLabelMenu).button().click(_.bind(function(){
            var label = this.navLabelMenu.data('label-latest');
                // label to send
                lbl = _.extend(label);
            label.name = $('#label-name').val();
            var colorSet = this.navLabelMenu.data('label-color-active').data('preset');
            label.color = colorSet.color;
            label.bg = colorSet.bg;
            var oldP = label.id_labels;
            label.id_labels = $('#label-parent').val();
            var lbl = _.clone(label);
            delete lbl.childs;
            $.post('/api/label/upsert', lbl, _.bind(function(data) {
                // update label colors in file list
                $('.label-item-' + label.id).css({
                    'color': '#' + label.color,
                    'background': '#' + label.bg
                }).text(label.name);
                // move label to new parent
                if(label.id_labels != oldP) {
                    if(oldP == 0) {
                        this.labels = $.grep(this.labels, function(l) {
                            return !(l.id == label.id);
                        });
                    } else {
                        this.labelsById[oldP].childs = $.grep(this.labelsById[oldP].childs, function(l) {
                            return !(l.id == label.id);
                        });
                        if(this.labelsById[oldP].childs.length == 0) {
                            delete this.labelsById[oldP].childs;
                        }
                    }
                    if(label.id_labels == 0) {
                        this.labels.push(label);
                    } else {
                        (this.labelsById[label.id_labels].childs ||
                            (this.labelsById[label.id_labels].childs = [])).push(label);
                    }
                }
                // re-render nav
                this.renderNav();
            }, this), 'JSON');
            this.navLabelMenu.hide();
        }, this));

        var dialog = $('<div />')
            .text(__('lbl.removelbldesc'))
            .append($('<div class="labels-list" />').css('margin', '1em 0'))
            .append('<div><input type="checkbox" id="remove-all-label-files" /><label for="remove-all-label-files">' + __('lbl.removefiles') + '</label></div>'),
            dialogOptions = {
                resizable: false,
                modal: true,
                hide: 'fade',
                show: 'fade',
                title: __('lbl.removelbl'),
                buttons: [{
                    text: __('lbl.delete'),
                    click: function() {
                        $(this).data('dialog').options.removeCallback();
                        $(this).dialog("close");
                    }
                },{
                    text: __('lbl.cancel'),
                    click: function() {
                        $(this).dialog("close");
                    }
                }]
            };

        $('<span />').text(__('lbl.remove')).appendTo(this.navLabelMenu).button().click(_.bind(function(){
            this.navLabelMenu.hide();
            var id = this.navLabelMenu.data('label-latest').id,
                // ids for remove
                rids = [],
                checkbox;

            $(dialog).dialog('destroy');
            (checkbox = $(dialog).children('.labels-list').empty().end().find('input[type=checkbox]'))
                .attr('checked', false);

            function appendTree(labels, tab) {
                tab || (tab = 0);
                $.each(labels, function(i, l) {
                    rids.push(l.id);
                    $('<b />').css('display', 'block').html((new Array(tab+1)).join('&nbsp;') + l.name).appendTo(dialog.children('.labels-list'));
                    l.childs && appendTree(l.childs, tab + 4);
                });
            }
            appendTree([this.navLabelMenu.data('label-latest')]);

            var removeLablesCallback = _.bind(function() {
                $.post('/api/label/delete', {id: rids}, _.bind(function(){
                    // remove label from labels array
                    $.each(rids, _.bind(function(i, id) {
                        if(this.labelsById[id].id_labels == 0) {
                            this.collection.labels = this.labels = $.grep(this.labels, function(i) {
                                return !(i.id == id);
                            });
                        } else {
                            this.labelsById[this.labelsById[id].id_labels].childs = $.grep(this.labelsById[this.labelsById[id].id_labels].childs, function(i) {
                                return !(i.id == id);
                            });
                            if(this.labelsById[this.labelsById[id].id_labels].childs.length == 0) {
                                delete this.labelsById[this.labelsById[id].id_labels].childs;
                            }
                        }
                    }, this));
                    // remove label from collection
                    $.each(this.collection.models, function(i, model) {
                        model.set({
                            'id_labels': _.without(model.get('id_labels'), rids)
                        });
                    });
                    // re-render labels navigation
                    this.renderNav();
                }, this), 'JSON');
            }, this);

            dialog.dialog(_.extend(dialogOptions, {
                removeCallback: _.bind(function() {
                    if(checkbox.attr('checked')) {
                        this.collection.update({
                            attributes: {
                                is_linked: '0',
                            },
                            id_labels: rids,
                            success: function() {
                                removeLablesCallback();
                            }
                        });
                    } else {
                        removeLablesCallback();
                    }
                }, this)
            }));
            return false;
        }, this));

        $('<span />').text(__('lbl.cancel')).appendTo(this.navLabelMenu).button().click(_.bind(function(){
            this.navLabelMenu.hide();
            return false;
        }, this));
    },

    setActiveColorSet: function(newActive) {
        var active = this.navLabelMenu.data('label-color-active');
        if(active) {
            active.removeClass('active');
        }
        active = newActive.addClass('active');
        this.navLabelMenu.data('label-color-active', active);
    },

    toggleNavLabelMenu: function(label, el) {

        this.navLabelMenu.data('label-latest', label);

        var s = $('#label-parent');
        s.empty();
        function appendOptions(options, tab) {
            tab || (tab = 0);
            $.each(options, function(i, o) {
                $('<option />').html((new Array(tab+1)).join('&nbsp;') + o.name).val(o.id).appendTo(s);
                o.childs && appendOptions(o.childs, tab + 4);
            });
        }
        appendOptions([{name: '', id: 0}]);
        appendOptions(this.labels);

        this.navLabelMenu.show();
        this.navLabelMenu.position({
            my: 'left top',
            at: 'left top',
            of: el,
            //collision: 'none'
        });

        this.navLabelMenu.find('#label-name').val(label.name);

        var active;
        $.each(this.presets, _.bind(function(i, p) {
            if(i == this.presets.length - 1) {
                active = p.el;
                p.color = label.color;
                p.bg = label.bg;
                p.el.css({
                    color: '#' + label.color,
                    background: '#' + label.bg,
                });
                p.el.show();
                return false;
            }
            if(p.color == label.color.toUpperCase() && p.bg == label.bg.toUpperCase()) {
                $(this.presets).last()[0].el.hide();
                active = p.el;
                return false;
            }
        }, this));

        this.setActiveColorSet(active);

        //this.navLabelMenu.find('#label-color').miniColors('value', '#' + label.color);
        //this.navLabelMenu.find('#label-bg').miniColors('value', '#' + label.bg);

        this.navLabelMenu.find('#label-parent option').attr('disabled', false);
        this.navLabelMenu.find('#label-parent option[value=' + label.id + ']').attr('disabled', 'disabled');
        function disableChilds(childs) {
            $.each(childs || [], function(i, child) {
                $('#label-parent option[value=' + child.id + ']').attr('disabled', 'disabled');
                child.childs && disableChilds(child.childs);
            });
        }
        disableChilds(label.childs);
        this.navLabelMenu.find('#label-parent').val(label.id_labels);

        //this.navLabelMenu.find('#label-color');

        return false;
    },

    panelNav: function(panel) {
        this.nav = panel;
        this.navElement = $('<div />').addClass('navigation-item-group-labeled');

        this.nav.addItem(this.navElement, 'labels', 100)

        this.labels && this.renderNav();
    },

    ////////////
    // LABELS //
    ////////////

    buildLabelsTree: function(linear, tree) {

        // remove old trees
        linear.empty();
        tree.empty();

        // appended labels list (linear view, non tree)
        $('<b>' + __('lbl.appended') + ':</b>').appendTo(linear);
        var l = this._tree(true, true).appendTo(linear);

        // tree view labels list
        $('<b>' + __('lbl.label') + ':</b>').appendTo(tree);
        var t  = this._tree(true).appendTo(tree);


        // hide all linear checkboxes (show only checked)
        l.find('input[type="checkbox"]').parent().parent().hide();
        // hide appended checkbox list
        linear.hide();

        // get labels list from checked files
        var labels = {}, models = zzlbox.views.Files.checked().models;
        $.each(models, function(i, file){
            $.each(file.get('id_labels'), function(i, id){
                labels[id] || (labels[id] = 0);
                labels[id]++;
            })
        });

        // check all labels for checked files
        $.each(labels, function(id, count){
            if(count == models.length) {
                // this label appended for all checked files
                t.find('#labels-' + id).tristate({start: 1, mixed: false, proxy: l.find('#labels-' + id)});
                l.find('#labels-' + id).tristate({start: 1, mixed: false, proxy: t.find('#labels-' + id)}).parent().parent().show();
            } else {
                // this label appended for part of checked files
                t.find('#labels-' + id).tristate({start: 2, proxy: l.find('#labels-' + id)});
                l.find('#labels-' + id).tristate({start: 2, proxy: t.find('#labels-' + id)}).parent().parent().show();
            }

            // show appended checkbox list
            linear.show();
        });

        $($.grep(t.find('input[type=checkbox]'), function(el) {
            return !$(el).data('tristate');
        })).tristate({mixed: false});
    },

    toolbarLabels: function(toolbar) {

        var that = this;

        // lables button in toolbar
        this.labelsButton = $('<span />')
            .text(__('lbl.labels'))
            .addClass('zzlbox-button-icon zzlbox-button-icon-small')
            .button({
                disabled:true,
                icons: {primary: 'ui-icon-folder'},
                text: false
            })
            .click(_.bind(function(){
                this.buildLabelsTree(linear, tree);
                create.hide();
                search.get(0).value = '';
                menu.toggle();
                menu.position({
                    my: 'right top',
                    at: 'right bottom',
                    of: this.labelsButton,
                    collision: 'none'
                });
            }, this)).unbind('mouseup.button').mouseleave(function(){
                menu.is(':visible') && that.labelsButton.addClass('ui-state-active');
            }).tipTip({content: 'labels'});

        // append button to toolbar
        toolbar.add(this.labelsButton, ' ', 10, 'actions');

        // labels menu
        var menu = $('<div />')
            .hide()
            .addClass('ui-widget ui-widget-content ui-dialog zzlbox-menu toolbar-labels-menu')
            .appendTo(this.labelsButton.parent());

        menu.data('toggle-button', this.labelsButton);

        // search field
        var search = $('<input type="text" />')
            .keyup(function(){
                tree.find('li').show();
                linear.find('input[type="checkbox"]:checked').parent().parent().show();
                create.hide();
                if(this.value != '') {
                    tree.find('li:not(:contains(' + this.value + '))').hide();
                    linear.find('li:not(:contains(' + this.value + '))').hide();
                    create.show();
                }
            })
            .appendTo(menu)

        // create button
        var create = $('<span>' + __('lbl.create') + '</span>').button().appendTo(menu).click(function(){
            $.post('/api/label/upsert', {
                name: search.get(0).value,
                sorder: that.labels.length == 0 ? undefined : ("" + (parseInt(_.last(that.labels).sorder) + 1))
            }, function(data) {
                data.label.bg || (data.label.bg = 'FFFFFF');
                data.label.color || (data.label.color = '000000');

                that.labelsById[data.label.id] = data.label;

                zzlbox.views.Files.collection.update({
                    attributes: {
                        id_labels: [data.label.id],
                    },
                    files: zzlbox.views.Files.checked().models,
                    success: function(data) {
                    },
                    link: true
                });

                // add label to labels array
                that.labels.push(data.label);
                // re-render navigation after create new label
                that.renderNav();
                // show label edit menu
                that.toggleNavLabelMenu(data.label, $('#label-toggle-nav-menu-' + data.label.id));
            }, 'JSON');
            menu.hide();
        });

        var linear = $('<div />').appendTo(menu).addClass('separated');
        var tree = $('<div />').appendTo(menu);

        // apply button
        $('<span>' + __('lbl.apply') + '</span>').button().appendTo(menu).click(function(){
            var nodes = zzlbox.views.Files.checked().els,
                /*labels = $.map(tree.find('input[type="checkbox"]:checked').parent().parent().toArray(), function(i){
                    return $(i).data('label');
                }),*/
                link = $.map(tree.find('input[type="checkbox"]').filter(function(i, el) {
                    return $(el).tristate('option', 'changed') && ($(el).tristate('option', 'state') == 1);
                }).parent().parent().toArray(), function(i) {
                    return $(i).data('label');
                }),
                unlink = $.map(tree.find('input[type="checkbox"]').filter(function(i, el) {
                    return $(el).tristate('option', 'changed') && ($(el).tristate('option', 'state') == 0);
                }).parent().parent().toArray(), function(i) {
                    return $(i).data('label');
                });

            if(link.length || unlink.length) {

                link.length && zzlbox.views.Files.collection.update({
                    attributes: {
                        id_labels: $.map(link, function(i){return i.id;})
                    },
                    link: true,
                    files: $.map(nodes, function(node){return $(node).data('model')}),
                });

                unlink.length && zzlbox.views.Files.collection.update({
                    attributes: {
                        id_labels: $.map(unlink, function(i){return i.id;})
                    },
                    unlink: true,
                    files: $.map(nodes, function(node){return $(node).data('model')}),
                });
            }

            menu.hide();
        });

        // cancel button
        $('<span>' + __('lbl.cancel') + '</span>').button().appendTo(menu).click(function(){menu.hide()});

        // look for checked files
        zzlbox.views.Files.bind('change:checked', function(models){
            // disable/enable label button in toolbar
            this.labelsButton.button(models.length > 0 ? 'enable' : 'disable');
        }, this);
    },

    // build ul-li tree display (use recursion)
    _tree: function(checkbox, linear) {

        var that = this;

        function folder(f, prefix) {
            var ret = $('<ul />');
            $.each(f, function(i, v) {
                var li = $('<li><span class="' + (v.childs ? 'folder' : 'file') + '">' + (prefix || '') + v.name + '</span></li>')
                    .appendTo(ret);
                if(v.childs) {
                    if(linear) {
                        folder(v.childs, (prefix || '') + v.name + ' / ').children().appendTo(ret);
                    } else {
                        if(checkbox || $.inArray(v.id, that.expandedLabels) == -1) {
                            li.addClass('closed');
                        }
                        li.append(folder(v.childs));
                    }
                }
                if(checkbox) {
                    // labels
                    li.prepend($('<input type="checkbox" id="labels-' + v.id + '" />'));
                    li.children().filter('input, span').wrapAll('<label />');
                } else {
                    // navigation
                    var link = $('<a href="#" />')
                        .addClass('navigation-item navigation-item-tree')
                        .css({
                            'position': 'relative',
                        })
                        .click(function(){
                            zzlbox.router.setQuery({id_labels: $(this).parent().data('label').id}, 'files');
                            return false;
                        })
                        .hover(function(){$(this).toggleClass('ui-state-hover hover ui-corner-all'); return false;});
                    li.addClass('navigation-item-tree-wrapper').children('span').wrap(link);
                    var menuB = $('<span id="label-toggle-nav-menu-' + v.id + '" />').addClass('default').css({
                        position: 'absolute',
                        right: 5,
                        top: 3,
                        'font-size': '0.8em',
                        opacity:0,
                    }).text('▼').appendTo(li.children('a'))
                    .hover(function(){$(this).toggleClass('special')})
                    .hover(function(){menuB.css({opacity: '1.0'})},function(){menuB.css({opacity: '0.2'})})
                    .click(function(){
                        that.toggleNavLabelMenu(v, this);
                        return false;
                    });
                    //li.children('a').hover(function(){menuB.css({opacity: '1.0'})},function(){menuB.css({opacity: '0.2'})})
                    li.children('a').hover(function(){menuB.css({opacity: 0.2})},function(){menuB.css({opacity: 0})})
                    //li.children().filter('div.hitarea').css({'margin-top': '0.4em', 'margin-left': '-10px'});
                }
                li.data('label', v);
            });
            return ret;
        }

        //return folder(zzlbox.views.Files.collection.labels).addClass('labels-tree').treeview();
        var tree = folder(this.labels).addClass('labels-tree').treeview(checkbox ? {} : {
            // save toggled item in navigation
            toggle: function() {
                var id = $(this).data('label').id;
                if($(this).hasClass('collapsable')) {
                    that.expandedLabels.push(id)
                } else {
                    that.expandedLabels = _.without(that.expandedLabels, id);
                }
            }
        });

        // navigation
        checkbox || tree.addClass('labels-tree-nav').find('div.hitarea')
            //.css({'margin-top': '0.4em', 'margin-left': '-10px'});

        return tree;
    },

});
