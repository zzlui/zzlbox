
// TODO copy functionality from gmail
// create submenu with values all/none/large/etc
ZZLBox.Plugins.CheckAll = ZZLBox.Plugin.extend({

    initialize: function() {
        zzlbox.plugins.bind('toolbar', this.toolbar, this);
    },

    toolbar: function(toolbar) {

        // TODO button + menu
        //$('<button><input type="checkbox" style="margin-right: 5px;"/></button>')
        //    .button()
        var item = $('<input type="checkbox" />');
        // should be first allways
        var title = toolbar.add(item, '&nbsp;', 0, 'first', 5).children('.title').css('text-align', 'center');

        item.tristate({
            change: function() {
                $('#file-list input[type=checkbox]').tristate('option', 'state', $(item).tristate('option', 'state'));
                //item.tristate('option', 'mixed', false);
                var checked = zzlbox.views.Files.checked();
                zzlbox.views.Files.trigger('change:checked', checked.models, checked.els);
            }
        });

        item.parent().css('margin-top', '6px').tipTip({content: __('check.label')});


        var last;
        zzlbox.views.Files.bind('change:checked', function(models, els) {
            title.html(models.length || '&nbsp;');
            if(models.length == 0) {
                item.tristate('option', 'mixed', false);
                item.tristate('option', 'state', 0);
            } else if(models.length < zzlbox.views.Files.collection.models.length) {
                item.tristate('option', 'mixed', true);
                item.tristate('option', 'state', 2);
            } else {
                item.tristate('option', 'mixed', false);
                item.tristate('option', 'state', 1);
            }
            if(last) {
                last.not(els).removeClass('highlight');
            }
            last = els;
            els.addClass('highlight');
        });

    }
});
