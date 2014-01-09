(function($){

$.widget( "ui.collapsible", {

    options: {
        lessText: '<- less',
        moreText: 'more ...',
        lessEffect: 'slideUp',
        moreEffect: 'slideDown'
    },

    _create: function() {
        var that = this;

        var expanded = false;
        this.element.children('.collapsible').hide();

        $('<a href="#expand" class="collapsible-button" />')
            .html(this.options.moreText)
            .click(function() {
                that.element.children('.collapsible')[that.options[expanded ? 'lessEffect' : 'moreEffect']]();
                expanded = !expanded;
                $(this).html(that.options[expanded ? 'lessText' : 'moreText']);
                return false;
            })
            .appendTo(this.element);
    }

});

})(jQuery)
