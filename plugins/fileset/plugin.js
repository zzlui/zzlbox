
ZZLBox.Plugins.Fileset = ZZLBox.Plugin.extend({

    initialize: function() {
        var that = this;

        zzlbox.plugins.bind('file-info', function(el, model) {
            model.fileset({
                success: function(files, tree) {
                    that.filesetTree(el, model, files, tree)
                }
            });
        }, this, 100);

        //zzlbox.plugins.bind('actions', this.actions, this, 5);

        zzlbox.plugins.bind('file-page', function(el) {
            // remove default size info
            el.find('b:contains(\'Size\'):eq(1)').parent().remove();
        });
    },

    filesetTree: function(el, model, files, tree) {

        if(files.length == 0) {
            return;
        }

        var list = $('<div class="zzlbox-info" />').appendTo(el);

        var title = $('<span><b>Files</b>: <b class="special">' + files.length + '</b>, <b>Size</b>: <b class="special">' + $(tree.size).fileSize() + '</b><span class="fileset-actions-all"></span></span>').appendTo(list);

        // ensure that we have folders
        if(tree.allfiles && (!tree.files || tree.allfiles.length != tree.files.length)) {
            // expand/collapse all button
            $('<a href="#" />')
                .addClass('ui-icon-expand-all')
                .click(function(){
                    t.toggleClass('expanded-all');
                    $(this).toggleClass('ui-icon-expand-all ui-icon-collapse-all')
                    $.each(t.find(t.hasClass('expanded-all') ? '.expandable-hitarea' : '.collapsable-hitarea'), function() {
                        toggler.apply(this);
                    });
                    return false;
                })
                .prependTo(title);
        }

        zzlbox.plugins.hook('fileset-actions-all', title.find('.fileset-actions-all').css({
            'margin-left': '5px'
        }), model, files, tree);

        /*var fsActions = $('<span />').prependTo(this.actionsEl);
        zzlbox.plugins.hook('fileset-actions-all', fsActions, model, files, tree);
        fsActions.find('span').removeClass('zzlbox-button-icon-small').button('option', 'text', true);*/

        // build ul-li folder display (use recursion)
        function folder(f) {
            var ret = $('<ul />');
            // folders
            $.each(f, function(i, v){
                if(i == 'files' || i == 'size' || i == 'allfiles') return;
                var el = $('<li class="closed"><span class="folder">' + i + ' (<b>' + v.allfiles.length + ', ' + $(v.size).fileSize() + '</b>)' + '</span></li>').appendTo(ret)
                    .append('<ul />')
                    .data('folder', v)
                    //.append(folder(v));

                var actel = $('<span />').addClass('fileset-actions-folder').css({
                    display: 'inline-block',
                    position: 'relative',
                    margin: '-100px -5px -100px 5px',
                    'top': '4px'
                }).hide().appendTo(el.children('span').css({
                    display: 'inline-block',
                    position: 'relative'
                }).hover(function() {
                    //actel.toggle();
                    actel.css('display', 'inline-block');
                }, function(){
                    actel.css('display', 'none');
                }));
                zzlbox.plugins.hook('fileset-actions-folder', actel, model, v.allfiles, v);
            });

            // files
            f.files && $.each(f.files, function(i, file) {
                var addonsStatus = 'show'; // show/hide/hover

                var el = $('<li><span class="file"><a href="' + file.url_dl + '">' + file.name + '</a></span></li>')
                    .addClass('file')
                    .data('file', file)
                    .appendTo(ret)
                    /*.hover(function() {
                        $(this).find('a').toggleClass('special');
                    })*/;

                // main info
                var main = $('<span class="main" />')
                            .html('&nbsp;<b>' + $(file.size).fileSize() + '</b>')
                            .appendTo(el);

                // additional info
                var addons = $('<div class="addons" />').appendTo(el).toggle(addonsStatus != 'hide');

                el.toggleClass('addons-on-hover', addonsStatus == 'hover');

                /*if(addonsStatus == 'hover') {
                    // can't make this via CSS
                    addons.mouseenter(function(){
                        $(this).hide();
                    }).mouseout(function() {
                        $(this).css('display', '');
                    })
                }*/

                var actel = $('<span class="actions" />').appendTo(main);

                // main info hook
                zzlbox.plugins.hook('fileset-info-main', main, model, file);
                // additional info hook
                zzlbox.plugins.hook('fileset-info-addons', addons, model, file);
                // actions hook
                zzlbox.plugins.hook('fileset-actions-item', actel, model, file);
                // item hook
                zzlbox.plugins.hook('fileset-item', el, model, file);

                el.find('*[title]').tipTip();
            });
            return ret;
        }

        var t = folder(tree).addClass('filetree fileset').appendTo(list).treeview({
            toggle: function() {
                //console.log(this, arguments);
                var ul = $(this).children('ul');
                if(ul.children().length > 0) {
                    return;
                }
                var f = folder($(this).data('folder'));
                //$(this).empty(d).append(f);
                $.each(f.children('li'), function(i, li) {
                    ul.append(li);
                    t.treeview({add: li});
                });

                if(t.hasClass('expanded-all')) {
                    $.each(ul.find('.expandable-hitarea'), function() {
                        toggler.apply(this);
                    });
                }
            }
        });

        var toggler = t.data('toggler');
    },

    actions: function(el, file, type) {
        if(type == 'filelist') {
            // files list
            var actions = $('<span />');

            zzlbox.plugins.hook('fileset-actions-all', actions, file);

            var imgA = actions.find('.ui-icon-albums').parent().get(0);
            var playA = actions.find('.ui-icon-play').parent().get(0);

            function placeholder() {
                return $('<span />')
                    .addClass('zzlbox-button-icon zzlbox-button-icon-small')
                    .text('_')
                    .button({
                        icons: {primary: 'ui-icon-placeholder'},
                        text: false,
                        disabled: true
                    })
                    .css('visibility', 'hidden')
                    .attr('title', '')
            }

            // show only one action
            $(playA && $(playA).addClass('ui-corner-all') || imgA || placeholder()).appendTo(el);
        /*} else if(type == 'fileinfo') {
            this.actionsEl = el;*/
        }
    },

});
