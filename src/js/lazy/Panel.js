Ext.define('Tualo.apachelog.lazy.Panel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.tualo_apachelog_panel',

    requires: [
        'Tualo.apachelog.lazy.controller.Panel',
        'Tualo.apachelog.lazy.models.Panel'
    ],
    controller: 'tualo_apachelog_panel',
    viewModel: {
        type: 'tualo_apachelog_panel'
    },
    listeners: {
        boxready: 'onBoxReady'
    },
    getWindowTitle: function () {
        return 'Apache Log'
    },
    getWindowIcon: function () {
        return 'fa-solid fa-gears';
    },
    title: 'Apache Log',
    closable: true,
    layout: 'border',
    items: [
        {
            region: 'center',
            xtype: 'grid',
            itemId: 'entries',
            plugins: {
                gridfilters: true
            },
            tbar: [
                {
                    xtype: 'segmentedbutton',
                    items: [
                        { text: 'Access-Log', value: 'access', pressed: true },
                        { text: 'Error-Log', value: 'error' }
                    ],
                    listeners: {
                        change: 'onLogTypeChange'
                    }
                },
                {
                    text: 'Aktualisieren',
                    iconCls: 'x-fa fa-sync',
                    handler: 'onRefresh'
                },
                {
                    xtype: 'textfield',
                    emptyText: 'Filter (URI, IP, Status, Meldung) ...',
                    width: 280,
                    listeners: {
                        change: {
                            fn: 'onFilterChange',
                            buffer: 300
                        }
                    }
                },
                '->',
                {
                    xtype: 'tbtext',
                    bind: {
                        text: '{logfile}'
                    }
                }
            ],
            columns: [],
            bind: {
                store: '{entries}'
            },
            listeners: {
                selectionchange: 'onSelectionChange'
            }
        },
        {
            region: 'south',
            split: true,
            height: 220,
            title: 'Details',
            collapsible: true,
            scrollable: true,
            bind: {
                html: '{detailHtml}'
            }
        }
    ]
});
