var __ = (function($) {

    var messages = {},
        folders = [],
        cache = {},
        locale, lang;

    $.locales = {

        set: function(l, callback) {
            locale = l.split('-').join('_');
            lang = locale.split('_')[0];
            $.locales.reset(callback);
        },

        addFolder: function(path, locales, callback) {
            // add locale folder
            var folder;
            folders.push(folder = {
                path: path,
                locales: locales
            });

            $.locales.loadFolder(folder, callback);
        },

        reset: function(callback) {
            var messages = {},
                ws = new WaitSync(function() {
                    callback();
                });

            $.each(folders, function(i, folder) {
                $.locales.loadFolder(folder, $.wrap($.noop))
            });
        },

        loadFolder: function(folder, callback) {
            var ws = new WaitSync(callback);
            $.locales.loadFile(folder.path + 'messages.json', ws.wrap(function() {
                ($.inArray(locale, folder.locales) >= 0) && $.locales.loadFile(folder.path + locale.split('_')[0] + '.json', ws.wrap($.noop));
                ($.inArray(lang, folder.locales) >= 0) && $.locales.loadFile(folder.path + lang + '.json', ws.wrap($.noop));
            }));
        },

        loadFile: function(file, callback) {
            if(cache[file]) {
                callback($.extend(messages, cache[file]));
                return;
            }
            $.get(file, function(data) {
                $.extend(messages, cache[file] = data);
                callback(data);
            }, 'JSON')
        },

        getText: function(id) {
            //console.log({locale: locale, messages: messages, folders: folders, cache: cache});
            return $.locales.format(messages[id] === undefined ? id : messages[id], Array.prototype.slice.call(arguments, 1));
        },

        format: function(s, args) {

            for(var i = args.length; i--;) {
                s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), args[i]);
            }

            return s;
        },

    };

    $.locales.set(navigator.language || navigator.userLanguage);
    //$.locales.set('ru');

    return $.locales.getText;
})(jQuery);
