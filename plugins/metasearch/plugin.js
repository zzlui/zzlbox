ZZLBox.Collections.Metasearch = ZZLBox.Collections.FilesAbstract.extend({
    uri: {
        get: '/api/plugins/metasearch',
        link: '/api/file/link',
        unlink: '/api/file/unlink',
    },

    filters: {
        match: {name: __('search.match'), 'default': 'all', type: 'radio', values: {all: __('search.all'), any: __('search.any'), extend: __('search.extend')}},
        filter: {name: __('search.results'), 'default': 'all', type: 'radio', values: {all: __('search.all'), cached: __('search.cached'), verified: __('search.verified')}},
        moderated: { name:__('search.moderated'), 'default': 'no', type: 'radio', values: {'no':__('search.no'), 'yes':__('search.yes'), 'full': __('search.full')} },
        q: {name: 'Search', 'default': '', type: 'text'},

        sort: {name: __('search.sort'), 'default': 'cached', type: 'select', values: {
            cached: __('search.cached'),
            relevance: __('search.relevance'),
            size: __('search.size'),
            size_asc: __('search.size_asc'),
            date: __('search.date'),
            date_asc: __('search.date_asc'),
        }},

        offset: {type: 'num', 'default': 0},
        limit: {type: 'num', 'default': 25},
    },

    onAfterRead: function(data) {
        this.stats = data.stats;
        this.found_files = data.stats.total_found;
        data.files && $.each(data.files, function() {
            // is_linked = 0 by default for search items
            this.is_linked == undefined && (this.is_linked = '0');
        });
    }
});

ZZLBox.Plugins.Metasearch = ZZLBox.Plugin.extend({

    initialize: function() {
        var collection = zzlbox.collections.Metasearch = new ZZLBox.Collections.Metasearch;
        zzlbox.views.Files.addCollection(collection, ['metasearch']);

        this.lastSeach = zzlbox.models.User.option('last-search') || [];

        // stats div
        this.stats = $('<div />')
            //.css({'border-bottom': '1px solid #DADADA'})
            //.insertBefore($('#content'));
        zzlbox.plugins.bind('Files-render', function() {
            this.stats.prependTo('#content');
        }, this)

        collection.bind('reset', this.updateStats, this);

        zzlbox.views.Files.bind('change:collection', this.changeCollection, this);
        zzlbox.router.bind('query:Files', function(query) {
            var state = (zzlbox.views.Files.collection === zzlbox.collections.Metasearch);
            if(state && zzlbox.plugins.Navigation) {
                zzlbox.plugins.Navigation.setState('last-search', zzlbox.router.query.q);
            }
        });

        zzlbox.plugins.bind('navigation', this.navigation, this);
        zzlbox.plugins.bind('files-add-one', this.addOne, this, 1);

        collection.bind('reset', this.upsertLastSearch, this);

        this.changeCollection(zzlbox.views.Files.collection);
    },

    changeCollection: function(collection) {
        var state = (collection === zzlbox.collections.Metasearch);
        this.stats.toggle(state);
        this.updateLastSearchActive();
    },

    updateStats: function() {
        var stats = zzlbox.collections.Metasearch.stats;

        this.stats.empty();

        //this.stats.html('Found: <b class="special">' + stats.total_found + '</b> files by ' + stats.time + ' secs');

        if(stats.query_changed == 'all_any') {
            $('<div class="info">')
                .html(__('search.match_mode'))
                .find('b:gt(0)').addClass('special').end()
                .prependTo(this.stats);
        }
    },

    navigation: function(nav) {
        zzlbox.plugins.wait('Filters', function(){
            this.hide('q');
            if(zzlbox.models.User.hasFlag('moderated_full')) {
                this.hide('moderated');
            }
        });

        var input = $('<input class="search" type="text" style="width: 15em; font-size:1.6em; vertical-align: bottom" />')
            .keyup(function(e){
                search.button(this.value.length > 0 ? 'enable' : 'disable');
                if(e.keyCode == $.ui.keyCode.ENTER) {
                    this.value.length > 0 && zzlbox.router.updateQuery({
                        q: this.value
                    }, 'metasearch');
                    return false;
                }
            }).bind('paste', function(e){
                setTimeout(function(){
                    search.button(e.target.value.length > 0 ? 'enable' : 'disable');
                }, 30);
            });

        var search = $('<span class="zzlbox-button-icon">' + __('search.s') + '</span>')
        .button({
            icons: {
                primary: 'ui-icon-search',
            },
            disabled: true,
            text: false
        }).click(function(){
            input[0].value.length > 0 && zzlbox.router.updateQuery({
                q: input[0].value
            }, 'metasearch');
            return false;
        }).css({
            //margin: '-1px',
            //position: 'absolute'
        }).tipTip();

        $('<span />').append(input).append(search)
            .insertAfter(nav.el.parent().children('.logo'))
            .css({
                'margin-left': '70px',
                'position': 'absolute'
            });

        input.searchinput({
            onClear: function() {
                search.button('disable');
            }
        });

        zzlbox.router.bind('query:Files', function(path, query) {
            input.val(query['q'] || '');
            input.val().length > 0  && search.button('enable');
            input.searchinput('refresh');
        }, this);

        $(window).on('resize', function() {
            var iw = $('#header').innerWidth() - 130; // 80 loader and some margins
            $('#header > *').each(function() {
                if($(this).is(input.parent().parent())) {
                    return;
                }
                iw -= $(this).outerWidth();
            })
            input.outerWidth(iw);
        });

        this._nav = nav;
        this.navLastSearch = $('<div />').addClass('navigation-item-group-labeled');
        nav.addItem(this.navLastSearch, 'last-search', 900);
        this.renderLastSearch();
    },

    upsertLastSearch: function() {
        var filter = _.clone(zzlbox.router.query);
        this.lastSeach = $.grep(this.lastSeach, function(f) {
            return f.q != filter.q;
        });
        this.lastSeach.push(_.extend(filter, {found_files: zzlbox.collections.Metasearch.found_files }));
        this.lastSeach.length > 5 && this.lastSeach.shift();
        zzlbox.models.User.option('last-search', this.lastSeach);
        this.renderLastSearch();
    },

    removeLastSearch: function(el) {
        this.lastSeach = $.grep(this.lastSeach, function(f) {
            return f.q != el.data('q');
        });
        el.remove();
        zzlbox.models.User.option('last-search', this.lastSeach);
    },

    renderLastSearch: function() {
        this.navLastSearch.empty();

        // add small 'last search' label
        this.lastSeach.length && $('<div />')
            .text(__('search.nav'))
            .appendTo(this.navLastSearch)
            .addClass('navigation-item-group-label');

        var that = this;
        $.each(this.lastSeach, function(i, s) {
            var item = $('<a href="#" />')
                .css('position', 'relative')
                .data('q', s.q)
                .text(s.q + ' (' + s.found_files + ')')
                .click(function(){
                    var q = _.clone(s);
                    delete q.found_files;
                    zzlbox.router.setQuery(q, 'metasearch');
                    return false;
                })
                .hover(function() {
                    close.toggle();
                });

            var close = $('<span />').text('x').appendTo(item).css({
                position: 'absolute',
                right: '5px',
                top: '3px',
                'font-size': '0.8em',
                'font-weight': 'bold',
                'display': 'none'
            }).hover(function(){
                close.toggleClass('special')
            }).click(function() {
                that.removeLastSearch(item);
                return false;
            });

            that._nav._decorate(item);
            item.appendTo(that.navLastSearch);
        });

        this.updateLastSearchActive();
    },

    updateLastSearchActive: function() {
        this.navLastSearch && this.navLastSearch.children('a').each(function() {
            $(this).removeClass('active');
            if($(this).data('q') == zzlbox.router.query.q) {
                $(this).addClass('active');
            }
        })
    },

    addOne: function(el, model) {

        // highlight query worlds
        if(zzlbox.views.Files.collection === zzlbox.collections.Metasearch) {
            el = el.find('div.name span.title');
            var q = zzlbox.collections.Metasearch._filter.q,
                r = new RegExp(q.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&'), 'gi');
            el.html(el.html().replace(r, '<span class="highlight">$&</span>'));
        }

    },

});
