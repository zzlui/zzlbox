
ZZLBox.Plugins.CusomPlugin = ZZLBox.Plugin.extend({

    initialize: function() {

        zzlbox.plugins.bind('files-add-one', this.appendFileType, this, 999);

    },

    appendFileType: function(item, model) {

        var type = model.get('type');

        if(type == 'audio' || type == 'video') {
            $('<div />')
                .addClass('file-type-icon file-type-' + type + '-icon')
                .insertBefore(item.find('span.title'));
        }

    }

});
