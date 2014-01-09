
ZZLBox.Collections.Feeds = ZZLBox.Collections.FilesAbstract.extend({
    uri: '/api/feed',

    onAfterRead: function(data) {
        data.files = data.feeds;
    },

    update: function(o) {
        if(o.files && o.attributes.is_linked && o.attributes.is_linked == '1') {
            // add feed
            var that = this;

            var ws = new WaitSync(function() {
                that.reqID = null;
                o.success && o.success();
            });

            $.each(_.union(o.files), function(i, feed) {
                typeof feed != 'object' && (feed = that.get(feed));
                $.post('/api/feed/add', {
                    url: feed.get('url'),
                    name: feed.get('name'),
                    flags: feed.get('notify') == '1' ? 'notify' : '',
                    pubdate: feed.get('pubdate')
                }, ws.wrap(function() {
                    feed.set({'is_linked': '1'});
                }), 'JSON');
            });
        } else {
            ZZLBox.Collections.FilesAbstract.prototype.update.apply(this, arguments);
        }
    }
});

ZZLBox.Plugins.Feeds = ZZLBox.Plugin.extend({

    initialize: function() {
        this.collection = zzlbox.collections.Feeds = new ZZLBox.Collections.Feeds();
        zzlbox.views.Files.addCollection(this.collection, 'feeds', __('feeds.feeds'));

        zzlbox.views.Files.bind('change:collection', function(collection) {
            this.nav && this.nav.toggle(collection === zzlbox.collections.Files);
        }, this);

        // add feeds list into navigation
        this.collection.bind('reset', this.resetFeeds, this);
        this.collection.bind('add', this.resetFeeds, this);
        this.collection.bind('remove', this.resetFeeds, this);

        // add navigation button 'Feeds'
        zzlbox.plugins.bind('navigation', function(nav){
            nav.addItem($('<a class="menu-icon-rss" href="/feeds" />').text(__('feeds.feeds')), 'feeds', 7);
        }, this);

        // bind navigation render
        this.nav = $('<div />').addClass('navigation-item-group-labeled');
        zzlbox.plugins.bind('navigation', function(nav) {
            nav.addItem(this.nav, 'feeds', 300);
            this.feeds && this.renderNav();
        }, this);

        // show additional feed information
        zzlbox.plugins.bind('addons', this.addons, this);
        //zzlbox.plugins.bind('files-add-one', this.fileList, this);
        zzlbox.plugins.bind('main', function(el, model) {
            if(model.collection === zzlbox.collections.Feeds && model.get('success_dt')) {
                el.children(':contains(Updated)').replaceWith(
                    $('<span />').text(__('feeds.last_fetch') + ': ').append($('<b>').append($(model.get('success_dt')).fileDate()))
                );
            }
        }, this);

        // add reset button
        zzlbox.plugins.bind('actions', function(item, model) {
            if(model.collection === this.collection) {
                var b = $('<span />')
                    .addClass('zzlbox-button-icon zzlbox-button-icon-small')
                    .text(__('feeds.reset'))
                    .button({
                        icons: {primary: 'ui-icon-refresh'},
                        text: false
                    })
                    .css('visibility', model.get('status') == 'disabled' ? 'visible' : 'hidden')
                    .click(function() {
                        $.post('/api/feed/reset', {id: model.get('id')}, function() {
                            model.set({'status': 'enqueue'});
                            //b.css('visibility', 'hidden');
                        }, 'JSON')
                    })
                    .appendTo(item);
            }
        }, this, 900);

        // remove filter id_feeds from toolbar
        zzlbox.plugins.wait('Filters', function(){
            this.hide('id_feeds');
        });

        // change active item in navigation
        zzlbox.router.bind('all', this.navActive, this);

        var that = this;
        this.display = 'list';
        zzlbox.plugins.wait('display-type', function() {
            this.bind('change:display', that.updateDisplay, that);
            that.updateDisplay(this._display);
        });
    },

    navActive: function(path, query) {
        // fetch feeds on first run (only on non-feeds page)
        // need for navigation menu
        if(!this._checked && zzlbox.router.getFragment() != 'feeds') {
            this._checked = true;
            this.collection.fetch();
        }

        if(!this.nav) return;

        // find current active link
        if(query && query.id_feeds) {
            zzlbox.plugins.Navigation && zzlbox.plugins.Navigation.setState('feeds-item');
            this.nav.find('a:not(.collapsible-button)').each(function(el){
                $(this).removeClass('active');
                if($(this).data('feed').id == query.id_feeds) {
                    $(this).addClass('active');
                }
            });
        }
    },

    resetFeeds: function(feeds) {
        this.feeds = true;

        $.each(this.collection.models, function(i, feed) {
            feed.set({'link': '/files?id_feeds=' + feed.get('id') });
        })

        this.nav && this.renderNav();
    },

    renderNav: function() {
        this.nav.empty();

        // add small 'feeds' label
        this.collection.models.length && $('<div />')
            .text(__('feeds.feeds_lbl'))
            .appendTo(this.nav)
            .addClass('navigation-item-group-label');

        // add feeds list
        var that = this, collapsed = 0, showCount = 5;
        $.each(this.collection.models, function(i, feed) {
            var cnt = parseInt(feed.get('cnt_finished'));
            var item = $('<a href="#" />')
                .text(feed.get('name') + ' (' + cnt + ')')
                .toggleClass('collapsible', cnt == 0 || ++collapsed > showCount)
                .data('feed', feed)
                .click(function(){
                    zzlbox.router.setQuery({id_feeds: feed.get('id')}, 'files');
                    return false;
                });
            zzlbox.plugins.Navigation && zzlbox.plugins.Navigation._decorate(item);
            item.appendTo(that.nav);
        });

        if(showCount <= this.collection.models.length) {
            this.nav
                    .children('.collapsible:lt(' + (showCount - collapsed) +')')
                    .removeClass('collapsible')
                    .end()
                .collapsible({
                    moreText: __('feeds.show_all') + ' &#8595;',
                    lessText: __('feeds.show_less') + ' &#8593;'
                });
        }

        // update active link
        this.navActive(zzlbox.router.chunks, zzlbox.router.query);
    },

    updateDisplay: function(display) {
        this.display = display;
        if(zzlbox.views.Files.collection !== this.collection) {
            return;
        }
        $('#file-list .file').each(function() {
            if($(this).data('feeds-el')) {
                $(this).data('feeds-el').appendTo($(this).children(display == 'table' ? '.name' : '.addons'));
            }
        });
    },

    addons: function(item, feed) {

        if(feed.collection != this.collection) {
            return;
        }

        $('<div />')
            .text(__('feeds.url') + ': ')
            .append('<a target="_blank" href="' + feed.get('url') + '">' + feed.get('url') + '</a>')
            .css({
                'white-space': 'nowrap',
                'overflow': 'hidden'
            })
            .appendTo(item);

        if(feed.get('status') == 'failed') {
            $('<div />')
                .addClass('warning')
                .text('/250 ' + __('feeds.temp_err') + '; ' + __('feeds.last') + ': ' + feed.get('err_msg'))
                .prepend('<b>' + feed.get('fail_cnt') + '</b>')
                .appendTo(item)
                .css({display: 'block'});
        }

        function failedItems() {
            if(feed.get('failed_items')) {
                var ret = $('<div />')
                    .addClass('warning table-hidden')
                $.each(feed.get('failed_items') || [], function(i, el) {
                    $('<div />')
                        //.addClass('warning')
                        .text(' - ' + el.err_msg)
                        .prepend('<b>' + el.cnt + ' ' + __('feeds.items') + '</b>')
                        .appendTo(ret)
                        .css({display: 'block'});
                });
                return ret;
            } else {
                return $();
            }
        }

        var fEl = $('<div />');

        $('<div />')
            .text(__('feeds.feed_items') + ': ' + __('feeds.enqueue') + '=' + feed.get('cnt_items_enqueue') +
                    ', ' + __('feeds.failed') + '=' + feed.get('cnt_items_failed') + ';'
                    + (feed.get('cnt_items_failed') > 0 ? (' ' + __('feeds.failed_items') + ':') : ''))
            .append(failedItems())
            .appendTo(fEl);

        zzlbox.router.links($('<div />')
            .html(__('feeds.dls') + ': ' + __('feeds.active') + '=' + feed.get('cnt_acctive')
                + ', ' + __('feeds.finished') + '=<b><a href="/files?id_feeds=' + feed.get('id') + '">' + feed.get('cnt_finished') + '</a></b>'
                + ', ' + __('feeds.failed') + '=' + feed.get('cnt_failed') + ';'))
            .appendTo(fEl);

        item.closest('div.file').data('feeds-el', fEl.appendTo(item.closest('div.file').children(this.display == 'table' ? '.name' : '.addons')));

        this.actions(item, feed);
    },

    actions: function(item, model) {
        //
        var b = $('<span />')
            .css({'font-size': '0.7em'});

        $('<input name="feed-' + model.get('id') + '-notify" type="radio" id="feed-' + model.get('id') + '-notify" value="notify" />')
            .attr('checked', model.get('notify') == '1')
            .add('<label for="feed-' + model.get('id') + '-notify">' + __('feeds.yes') + '</label>')
            .appendTo(b);

        $('<input name="feed-' + model.get('id') + '-notify" type="radio" id="feed-' + model.get('id') + '-" value="" />')
            .add('<label for="feed-' + model.get('id') + '-">' + __('feeds.no') + '</label>')
            .attr('checked', model.get('notify') != '1')
            .appendTo(b)

        b.buttonset()
            .wrap('<span />').parent().prepend('<span>' + __('feeds.notify') + ' </span>')
            //.prependTo(item);
            .appendTo(item)
            .change(function(e) {
                $.post('/api/feed/update', {
                    id: model.get('id'),
                    flags: $(e.target).val()
                });
                return false;
            });

        // fix jquery UI corners bug
        b.children('label').first().removeClass('ui-corner-right').addClass('ui-corner-left');
        b.children('label').last().removeClass('ui-corner-left').addClass('ui-corner-right');

        var p, e, i = $('<span />'), bb;

        $('<span />').text(__('feeds.pub_after') + ': ')
            .append(p = $('<input type="text" value="' + model.get('pubdate') + '" />').datepicker({
                showOtherMonths: true,
                selectOtherMonths: true,
                dateFormat: 'yy-mm-dd',
                changeMonth: true,
                changeYear: true
            }).css('width', '8em'))
            .appendTo(i);

        $('<span />').text(', ' + __('feeds.ep') + ' >= ')
            .append(e = $('<input type="text" value="' + (model.get('episode') || '') + '" />')
            .css('width', '8em'))
            .append(bb = $('<span />').text(__('feeds.save')).button().css('font-size', '0.7em').click(function(){
                $(this).button('disable');
                $.post('/api/feed/update', {
                    id_feeds: model.get('id'),
                    pubdate: $(p).val(),
                    episode: $(e).val()
                }, function() {
                    bb.children('.ui-button-text').text(__('feeds.saved'));
                });
                return false;
            }))
            .appendTo(i);

            $(p).add(e).change(function() {
                bb.button('enable').children('.ui-button-text').text(__('feeds.save'))
            }).keyup(function() {
                bb.button('enable').children('.ui-button-text').text(__('feeds.save'))
            });

        i.appendTo(item);
    }
});
