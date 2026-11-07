Ext.define('Tualo.apachelog.lazy.controller.Panel', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.tualo_apachelog_panel',

    accessColumns: [
        { text: 'Zeit', dataIndex: 'timestamp', width: 150 },
        { text: 'Client', dataIndex: 'client_ip', width: 130, filter: { type: 'string' } },
        { text: 'Methode', dataIndex: 'method', width: 85, filter: { type: 'string' } },
        {
            text: 'Status', dataIndex: 'status', width: 75, filter: { type: 'number' },
            renderer: function (value) {
                if (Ext.isEmpty(value)) return '';
                if (value >= 500) return '<span style="color:#c0392b;font-weight:bold;">' + value + '</span>';
                if (value >= 400) return '<span style="color:#e67e22;font-weight:bold;">' + value + '</span>';
                if (value >= 300) return '<span style="color:#2980b9;">' + value + '</span>';
                return value;
            }
        },
        { text: 'URI', dataIndex: 'uri', flex: 1, filter: { type: 'string' } },
        { text: 'Bytes', dataIndex: 'bytes', width: 90, align: 'right' },
        { text: 'Benutzer', dataIndex: 'user', width: 100, filter: { type: 'string' } },
        { text: 'Referer', dataIndex: 'referer', width: 180, filter: { type: 'string' } },
        { text: 'User-Agent', dataIndex: 'user_agent', width: 200, filter: { type: 'string' } }
    ],

    errorColumns: [
        { text: 'Zeit', dataIndex: 'timestamp', width: 150 },
        {
            text: 'Level', dataIndex: 'level', width: 90, filter: { type: 'string' },
            renderer: function (value) {
                if (['emerg', 'alert', 'crit', 'error'].indexOf(value) !== -1) {
                    return '<span style="color:#c0392b;font-weight:bold;">' + Ext.String.htmlEncode(value) + '</span>';
                }
                if (value === 'warn') {
                    return '<span style="color:#e67e22;">' + Ext.String.htmlEncode(value) + '</span>';
                }
                return Ext.String.htmlEncode(value);
            }
        },
        { text: 'Modul', dataIndex: 'module', width: 110, filter: { type: 'string' } },
        { text: 'Client', dataIndex: 'client_ip', width: 130, filter: { type: 'string' } },
        { text: 'PID', dataIndex: 'pid', width: 70 },
        { text: 'Meldung', dataIndex: 'message', flex: 1, filter: { type: 'string' } }
    ],

    onBoxReady: function () {
        this.applyColumns();
        this.loadEntries();
    },

    applyColumns: function () {
        let me = this,
            model = me.getViewModel(),
            grid = me.getView().down('#entries'),
            columns = model.get('logtype') === 'error' ? me.errorColumns : me.accessColumns;
        grid.reconfigure(model.getStore('entries'), columns);
    },

    loadEntries: function () {
        let me = this,
            model = me.getViewModel(),
            store = model.getStore('entries'),
            view = me.getView();

        view.setLoading(true);
        model.set('selectedEntry', null);
        store.load({
            params: {
                type: model.get('logtype'),
                limit: model.get('limit')
            },
            callback: function (records, operation, success) {
                view.setLoading(false);
                if (!success) {
                    let msg = 'Fehler beim Laden des Logs.';
                    try {
                        let response = Ext.decode(operation.getError().response.responseText);
                        if (response.msg) msg = response.msg;
                    } catch (e) {
                        // Standardmeldung verwenden
                    }
                    Ext.Msg.alert('Apache Log', msg);
                } else {
                    let raw = store.getProxy().getReader().rawData;
                    if (raw) {
                        if (raw.success === false) {
                            Ext.Msg.alert('Apache Log', raw.msg || 'Fehler beim Lesen des Logs.');
                        }
                        if (raw.logfile) {
                            model.set('logfile', raw.logfile);
                        }
                    }
                }
            }
        });
    },

    onRefresh: function () {
        this.loadEntries();
    },

    onLogTypeChange: function (segmented, value) {
        this.getViewModel().set('logtype', value);
        this.applyColumns();
        this.loadEntries();
    },

    onSelectionChange: function (grid, selected) {
        this.getViewModel().set('selectedEntry', selected.length > 0 ? selected[0] : null);
    },

    onFilterChange: function (field) {
        let store = this.getViewModel().getStore('entries'),
            value = (field.getValue() || '').toLowerCase();

        store.clearFilter();
        if (value !== '') {
            store.filterBy(function (record) {
                let haystack = [
                    record.get('uri'),
                    record.get('client_ip'),
                    record.get('user_agent'),
                    record.get('message'),
                    record.get('module'),
                    record.get('level'),
                    '' + record.get('status')
                ].join(' ').toLowerCase();
                return haystack.indexOf(value) !== -1;
            });
        }
    }
});
