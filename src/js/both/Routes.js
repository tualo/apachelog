Ext.define('Tualo.routes.ApacheLog', {
    statics: {
        load: async function () {
            return [
                {
                    name: 'Apache Log',
                    path: '#apachelog/panel'
                }
            ]
        }
    },
    url: 'apachelog/panel',
    handler: {
        action: function () {
            try {
                let fn = async function () {
                    let result = await fetch('./apachelog/access');
                    result = await result.json();
                    if (result.success) {
                        Ext.getApplication().addView('Tualo.apachelog.lazy.Panel');
                    }
                }();
            } catch (e) {
                console.error(e);
            }
        },
        before: function (action) {
            //Ext.require('Tualo.apachelog.lazy.Panel', function () {
            action.resume();
            //}, this);
        }
    }
});
