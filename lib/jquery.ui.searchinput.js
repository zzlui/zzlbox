(function($){

$.widget( "ui.searchinput", {

    options: {
        disabled: false,
        onClear: function(){}
    },

    widget: function() {
        return this.element.parent();
    },

    _create: function() {
        var that = this;

        this.clear = $('<span />')
            .addClass('clear-input-button')
            .click(function() {
                that.element.val('');
                that.refresh();
                that.options.onClear();
            });

        this.element
            .wrap('<span />')
            .parent()
            .css('position', 'relative')
            .append(this.clear);

        this.element
            .keyup(function() {
                that.refresh();
            });

        that.refresh();
    },

    refresh: function(force) {
        this.clear.toggle(this.element.val().length > 0)
    },

    _setOption: function(key, value) {
        // TODO disabled
        $.Widget.prototype._setOption.apply( this, arguments );
    },

    _destroy: function() {
        // TODO
    },

});

})(jQuery)
