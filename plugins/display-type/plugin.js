
ZZLBox.Plugins.DisplayType = ZZLBox.Plugin.extend({

    _display: 'list',

    initialize: function(){

        this._width = 0;
        this._table = null;

        zzlbox.plugins.bind('Files-render', function(view) {
            view.$('#file-list').addClass('display-type');
        }, this);

        zzlbox.router.bind('change:view', function(view) {
            if(view != 'Files') {
                $('#content').removeClass('grid table list');
            }
        }, this);

        zzlbox.plugins.bind('toolbar', this.toolbar, this);
    },

    toolbar: function(toolbar) {
        // get display from options
        var display = this.updateDisplay(zzlbox.models.User.option('display-type'), true);

        var b = $('<span id="display-type">' +
              '<input type="radio" id="display0" name="display" data-type="table" /><label for="display0" title="' + __('dt.table') + '">T</label>' +
              '<input type="radio" id="display1" name="display" data-type="grid" /><label for="display1" title="' + __('dt.grid') + '">G</label>' +
              '<input type="radio" id="display2" name="display" data-type="list" /><label for="display2" title="' + __('dt.list') + '">L</label>' +
          '</span>').addClass('zzlbox-toolbar-buttonset');

        b.children('input').map(function(){
            if(display == $(this).data('type')) {
                this.checked = true;
            }
        });

        b.buttonset()
            .change(_.bind(function(e){
                this.updateDisplay($(e.target).data('type'));
            }, this));

        b.find('#display0').button('option', 'icons', {primary: 'ui-icon-display-table'});
        b.find('#display1').button('option', 'icons', {primary: 'ui-icon-display-grid'});
        b.find('#display2').button('option', 'icons', {primary: 'ui-icon-display-list'});

        b.find('input').button('option', 'text', false);

        b.find('label').addClass('zzlbox-button-icon zzlbox-button-icon-small').tipTip();

        // fix jquery UI corners bug
        b.children('label').first().removeClass('ui-corner-right');// .addClass('ui-corner-left');
        b.children('label').last().removeClass('ui-corner-left'); //.addClass('ui-corner-right');

        toolbar.add(b, __('dt.label'), 10, 'first', 5);

        zzlbox.views.Files.bind('render', this.updateDisplay, this);
        //zzlbox.plugins.bind('files-add-one', this.updateItemSize, this)
        //zzlbox.plugins.bind('files-add-one', this.gridView, this)
        zzlbox.plugins.bind('files-add-one', this.listView, this)
    },

    updateDisplay: function(display, dontSave) {

        // save current top scroll
        // find top visible item
        var topItem;
        if($('#file-list').length) {
            var offset = $('#file-list').offset().top + $(window).scrollTop();

            $('#file-list .file').each(function(i) {
                if($(this).offset().top + $(this).outerHeight(true) / 2 > offset) {
                    topItem = this;
                    return false;
                }
            })
        }

        if(display) {
            this._display = display;

            // save to options
            dontSave || zzlbox.models.User.option('display-type', display);
        }

        // change CSS class
        $('#file-list, #content')
            .removeClass('table')
            .removeClass('grid')
            .removeClass('list')
            .addClass(this._display);

        this.trigger('change:display', this._display);

        $.grep($('#file-list .file'), _.bind(this.listView, this));

        // retore top scroll
        if(topItem) {
            $(window).scrollTop($(topItem).offset().top - $('#file-list').offset().top);
        }

        return this._display;
    },

    listView: function(item, model) {
        $(item).find('.actions')[this._display == 'list' ? 'prependTo' : 'appendTo'](item);
    }

});
