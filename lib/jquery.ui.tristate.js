(function($){

$.widget( "ui.tristate", {

    options: {
        disabled: false,
        mixed: true,
        start: null,
        changed: false,
        proxy: null
    },

    widget: function() {
        
    },

    _create: function() {
        var that = this;
        this.tristate = $('<div />')
            .addClass('ui-tristate');

        this.state = $('<div />')
            .addClass('state')
            .appendTo(this.tristate);

        this.label = this.element.closest('label')
        if(this.label.length) {
            this.element.insertBefore(this.label);
        }

        this.tristate.insertBefore(this.element).append(this.element);
        this.element.hide();

        if(this.options.start === null) {
            this.options.start = this.element.is(':checked') + 0;
        }
        this.options.state = this.options.start;

        // actions
        this.tristate.add(this.label)
            .click(function() {
                that.nextState();
                return false;
            });

        this.element.change(function() {
            that.setState(this.element.is(':checked') + 0);
        });

        this._refresh();
    },

    _refresh: function(force) {
        this.state
            .removeClass('default checked mixed')
            .addClass(['default', 'checked', 'mixed'][this.options.state]);

        this.options.changed = this.options.state != this.options.start;
        this.element.attr('checked', !!this.options.state);

        if(!force && this.options.proxy) {
            $(this.options.proxy).tristate('option', 'state', this.options.state);
        }

        force || this._trigger('change');
    },

    _setOption: function(key, value) {
        // TODO disabled
        if( key == 'state') {
            this.setState(value, true);
        }
        $.Widget.prototype._setOption.apply( this, arguments );
    },

    _destroy: function() {
        // TODO
    },

    setState: function(state, force) {
        this.options.state = state;
        this._refresh(force);
    },

    nextState: function() {
        if(this.options.mixed) {
            this.options.state = (this.options.state + 1) % 3;
        } else {
            this.options.state = 1 - this.options.state;
        }
        this._refresh();
    }

});

})(jQuery)
