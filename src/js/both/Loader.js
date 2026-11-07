Ext.define('Tualo.apachelog.Loader', {
    singleton: true,

    constructor: function () {
        Ext.Loader.setPath('Tualo.apachelog.lazy', './js/apachelog/lazy');
    }
});
