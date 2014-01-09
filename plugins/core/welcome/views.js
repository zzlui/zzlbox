
ZZLBox.Views.Welcome = ZZLBox.View.extend({

    onAfterRender: function() {

        var el = $('#welcome').appendTo(this.el).show();

        var messages = el.find('.messages');

        // login form init
        $('#login-form').zzlform({
            onSuccess: function() {
                zzlbox.models.User.fetch();
            },
            container: messages,
            errorPosition: 'center left'
        });

        // recover form init
        $('#recover-button').click(function(){
            // recover form show
            $('#login-form').fadeOut(200, function(){$('#recover-form').fadeIn();});
            return false;
        });
        $('#recover-form').zzlform({
            container: messages,
            message: {
                info: 'We just e-mailed you a password recovery link. Please check your e-mail and click on the link to set a new password.'
            },
            errorPosition: 'center left'
        });

        // reg form init
        $('#register-button').click(function(){
            // recover form show
            $('#login-form').slideUp(200, function(){$('#register-form').slideDown();});
            return false;
        });
        $('#register-form').zzlform({
            container: messages,
            success: function() {
                zzlbox.models.User.fetch();
            },
            errorPosition: 'center left'
        });
    },

    remove: function() {
        // hide login div
        $('#welcome').hide().appendTo('body');
        this.rendered = false;
        return this;
    }
});

