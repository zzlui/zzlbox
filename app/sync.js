// this override allow to use furk.net api instead REST requests
Backbone.sync = function(method, model, options) {
    // allow to double filters, and append event callbacks before event fire
    setTimeout(function(){
        model['_' + method](options);
    }, 22);
};
