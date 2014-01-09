(function($){
    function createContainers(container, b) {
        var ret = {all: $()};
        $.each(['error', 'info', 'success'], function(i, v) {
            ret[v] = $(container[v] || container.all).find('div.' + v);
            if(ret[v].length == 0) {
                ret[v] = $('<div />').addClass(v).hide();
                if($(container.all).has(b).length) {
                    ret[v].insertBefore(b);
                } else {
                    ret[v].appendTo(container.all)
                }
            }
            ret.all = ret.all.add(ret[v]);
        });
        return ret;
    }

    function showContainerMessage(container, message) {
        message && container.text(message).fadeIn();
    }

    $.fn.zzlform = function(options) {

        var defaults = {

            container: {
                /*info: null,
                error: null,
                success: null*/
            },

            message: {
                button: 'Success'
                /*success: null,
                error: null,
                info: null,*/
            },

            onSuccess: $.noop,
            onError: $.noop,
            onResponce: $.noop,

            errorPosition: 'center right'
        };

        options = $.extend(defaults, options);

        // prepare options
        typeof options.message == 'object' || (options.message = {button: options.message});
        options.message.button || (options.message.button = 'Success')
        if(options.container && (options.container instanceof jQuery || typeof options.container != 'object')) {
            options.container = {all: options.container};
        }

        var forms = this.filter('form').filter(function() {
                return !$(this).data('zzlform');
            }).data('zzlform', true),
            inputs = forms.find('input, select'),
            buttons = inputs.filter('[type=submit]').add(inputs.filter('[type=button]')),
            radios = inputs.filter('[type=radio]').add(inputs.filter('[type=button]'));
            // TODO not needed now
            //checkboxes = inputs.filter('[type=radio]').add(inputs.filter('[type=button]'));

        forms.addClass('form');
        buttons.button();
        radios.parent().buttonset();
        inputs
            .not(buttons)
            .not(radios)
            //.not(checkboxes) // TODO seeabove
            .not('.ui-buttonset').prev('span').addClass('title').end().wrap($('<div />').addClass('ui-state-default'));

        if($.browser.msie) {
            inputs.not(buttons).keypress(function(e) {
                if(e.keyCode == $.ui.keyCode.ENTER) {
                    $(this).closest('form').submit();
                    return false;
                }
            });
        }

        forms.submit(function(){

            var form = $(this),
                validator = $(this).data('validator'),
                button = form.find('input[type=submit]'),
                container = createContainers($.extend({}, {all: form}, options.container), button);

            if(validator.checkValidity()) {
                // disable button to prevent double loading
                button.button('disable');
                // hide error/info/success
                container.all.hide();
                $.post(this.action, form.serialize(), function(resp){
                    if (resp.status == 'error') {
                        // re-enable button
                        button.button('enable');
                        // show error
                        resp.error && container.error.text(resp.error).fadeIn();
                        // call validator error callback
                        validator.reflow();
                        resp.errors && validator.invalidate(resp.errors);
                        // call options.errors callback
                        options.onError.call(form, resp.errors);
                    } else if (resp.status == 'ok') {
                        // show message on button
                        button.val(options.message.button);

                        // if we have success message show it
                        showContainerMessage(container.success, options.message.success);

                        // if we have info message show it
                        showContainerMessage(container.info, options.message.info || resp.message);

                        // call options.success callback
                        options.onSuccess.call(form, resp);
                    }
                    // call options.responce callback
                    options.onResponce.call(form, resp);
                });
            }
            return false;
        }).validator({position: options.errorPosition, messageClass: 'error form-error', inputEvent: 'blur'});

        return forms;
    }
})(jQuery)
