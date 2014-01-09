
ZZLBox.Views.Upload = ZZLBox.View.extend({
    tpl: 'upload',

    onAfterRender: function() {

        zzlbox.plugins.Navigation && zzlbox.plugins.Navigation.setState('add', __('add.add'));

        $('#feed-add').toggle(zzlbox.plugins.Feeds != undefined);

        var list = [], loaded = 0;

        // TODO progress (not needed for small .torrent files, any file types is not allowed now in API)
        $('#upload-field').fileupload({
            limitConcurrentUploads: 3,
            dataType: 'json',
            url: '/api/dl/add',
            send: function (e, data) {
                updateList(data, {status: 'Loading'});
            },
            done: function (e, data) {
                updateList(data, data.result);
            },
            add: function(e, data) {
                var file = data.files[0];
                data.name = file.fileName || file.name; // name available only in IE
                data.size = file.fileSize;
                data.ul = '#upload-list-file';
                updateList(data);
                data.listId = list.length;
                list.push(data);
            },
            formData: function(form) {
                return [
                    {name: 'notify', value: $('#file-notification-buttonset input:checked').val()}
                ];
            },
        });

        function updateList(data, result) {
            $(data.ul).css('max-width', '500px');

            if(!data.item) {
                data.sizeFormated = data.size ? ('<b>(' + $(data.size).fileSize() + ')</b>') : '';
                data.item = $.tmpl('<li><span>${name}</span> {{html sizeFormated}} <span class="upload-status"></span></li>', data)
                    .appendTo(data.ul);
            }
            if(result) {
                data.item.find('.upload-status').removeClass('loader').show();
                data.item.find('.upload-status').text(result.status);
                if(result.status == 'Loading') {
                    data.item.find('.upload-status').text('').addClass('loader');
                } else {
                    data.item.find('.upload-status').addClass('status-' + result.status);
                }
                //'reason': data.status == 'error' ? data.error : '',
            }
        }

        $('#file-notification-buttonset').buttonset();
        $('#feed-notification-buttonset').buttonset();
        $('#feed-pubdate').datepicker({
            showOtherMonths: true,
            selectOtherMonths: true,
            dateFormat: 'yy-mm-dd',
            changeMonth: true,
            changeYear: true
        }).val($(new Date()).fileDate({fullDate: true, withTitle: false}));

        $('#upload-button').button().click(function(){
            var url = $('#upload-url').val(),
                data;
            if(list.length > 0) {
                $.each(list, function(i, data) {
                    if(i<loaded) return;
                    //updateList(data, {status: 'Loading'});
                    data.submit();
                    loaded++;
                });
            } else if(url.length > 0) {
                data = {
                    name: url.split('/').slice(-1)[0],
                    ul: '#upload-list-url'
                };
                updateList(data, {status: 'Loading'});
                $.get('/api/dl/add', {url: url}, function(result) {
                    updateList(data, result);
                    zzlbox.collections.Files.reqID = null;
                }, 'json')
            }
        });

        $('#upload-feed-button').button().click(function(){
            var feed = {
                name: $('#feed-name').val(),
                url: $('#feed-url').val(),
                flags: $('#feed-notification-buttonset input:checked').val(),
                pubdate: $('#feed-pubdate').val(),
                episode: $('#feed-episode').val()
            }, data = {
                name: feed.name,
                ul: '#upload-list-feed'
            };
            updateList(data, {status: 'Loading'});
            $.get('/api/feed/add', feed, function(result) {
                updateList(data, result);
                zzlbox.collections.Feeds.reqID = null;
            });
        });
    },

});

ZZLBox.Plugins.Upload = ZZLBox.Plugin.extend({
    initialize: function() {
        var that = this;
        zzlbox.plugins.bind('navigation', that.appendButton, that);
    },

    appendButton: function(nav) {
        var b = $('<span id="add-button" class="zzlbox-button-icon">' + __('add.files_add') + '</span>')
            .button({
                icons: {
                    primary: 'ui-icon-upload',
                },
                //text: false
            }).click(function(){
                zzlbox.router.navigate('add', true);
            });
        nav.addItem(b, 'add', 100, 'main');
    }
});
