
ZZLBox.Plugins.ScrollPagination = ZZLBox.Plugin.extend({

    initialize: function() {
        zzlbox.plugins.bind('toolbar', this.toolbar, this);

        this.limit = 25; //count
        this.bottomOffset = 100; //px
        this.busy = false;

        zzlbox.router.bind('query:Files', function(path, query) {
            var collection = zzlbox.views.Files.collection,
                limit = collection.reqID ? collection.reqID.replace(/^.*?limit=(\d+).*/, '$1') : false;
            collection.filter({
                offset: 0,
                limit: limit || this.limit
            }, true);
        }, this);

        zzlbox.plugins.bind('files-append', function(el) {
            var that = this;
            setTimeout(function(){
                that.checkScroll();
            }, 22)
        }, this);


        zzlbox.router.bind('change:view', function(view) {
            if(view == 'Files') {
                $(window).on('scroll.pagination', _.bind(this.checkScroll, this));
            } else {
                $(window).off('scroll.pagination');
            }
        }, this)
    },

    toolbar: function(toolbar) {
        zzlbox.plugins.wait('Filters', function(){
            this.hide('offset');
            this.hide('limit');
        });
    },

    checkScroll: function() {

        if(!zzlbox.views.Files.rendered || this.busy || $('#content #file-list .file').length == 0 || (function(c){return c.length >= c.found_files})(zzlbox.views.Files.collection)) {
            return;
        }

        /*var max = (function(el){
                    return el.offset().top + el.height()
                  })($('#file-list').children().last()) -
                  $('#content').height() -
                  this.bottomOffset;*/

        var max = $('body').outerHeight(true) - this.bottomOffset - $(window).innerHeight();

        if($(window).scrollTop() > max) {
            this.busy = true;
            var loader = $('<div />')
                .addClass('file')
                .css({'text-align': 'center'})
                .append($('<div />').addClass('loader').css({'margin': 'auto'}))
                .appendTo($('#file-list')),
                collection = zzlbox.views.Files.collection;
            collection.filter({
                offset: collection.length,
                limit: this.limit
            }, true).fetch({add: true, success: _.bind(function(){
                collection.updateReqID({offset: 0, limit: collection.length}, true);
                this.busy = false;
                loader.remove();
            }, this)});
        }
    }

});
