Ext.define('Tualo.apachelog.lazy.models.Panel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.tualo_apachelog_panel',
    data: {
        logtype: 'access',
        limit: 500,
        logfile: '',
        selectedEntry: null
    },
    formulas: {
        detailHtml: function (get) {
            let entry = get('selectedEntry');
            if (!entry) {
                return '<div style="padding:12px;color:#888;">Eintrag auswählen, um Details zu sehen.</div>';
            }
            let esc = Ext.String.htmlEncode,
                html = '<div style="padding:12px;font-size:12px;">';
            html += '<table style="border-spacing:0 2px;">';
            let row = function (label, value) {
                if (Ext.isEmpty(value)) return '';
                return '<tr><td style="color:#888;padding-right:12px;white-space:nowrap;vertical-align:top;">'
                    + esc(label) + '</td><td style="word-break:break-all;">' + value + '</td></tr>';
            };
            html += row('Zeit', esc(entry.get('timestamp')));
            html += row('Client', esc(entry.get('client_ip')));
            html += row('Benutzer', esc(entry.get('user')));
            if (entry.get('type') === 'access') {
                html += row('Request', esc(
                    (entry.get('method') + ' ' + entry.get('uri') + ' ' + entry.get('protocol')).trim()
                ));
                html += row('HTTP-Status', esc(entry.get('status')));
                html += row('Bytes', esc(entry.get('bytes')));
                html += row('Referer', esc(entry.get('referer')));
                html += row('User-Agent', esc(entry.get('user_agent')));
            } else {
                html += row('Modul', esc(entry.get('module')));
                html += row('Level', esc(entry.get('level')));
                html += row('PID', esc(entry.get('pid')));
                html += row('Meldung', esc(entry.get('message')));
            }
            html += '</table>';
            html += '<div style="margin-top:10px;padding:8px;border:1px solid #ddd;border-radius:4px;'
                + 'font-family:monospace;word-break:break-all;color:#555;">'
                + esc(entry.get('raw')) + '</div>';
            html += '</div>';
            return html;
        }
    },
    stores: {
        entries: {
            type: 'json',
            autoLoad: false,
            fields: [
                { name: 'type', type: 'string' },
                { name: 'timestamp', type: 'string' },
                { name: 'client_ip', type: 'string' },
                { name: 'user', type: 'string' },
                { name: 'method', type: 'string' },
                { name: 'uri', type: 'string' },
                { name: 'protocol', type: 'string' },
                { name: 'status' },
                { name: 'bytes' },
                { name: 'referer', type: 'string' },
                { name: 'user_agent', type: 'string' },
                { name: 'module', type: 'string' },
                { name: 'level', type: 'string' },
                { name: 'pid', type: 'string' },
                { name: 'message', type: 'string' },
                { name: 'raw', type: 'string' }
            ],
            proxy: {
                type: 'ajax',
                url: './apachelog/read',
                reader: {
                    type: 'json',
                    rootProperty: 'data'
                }
            }
        }
    }
});
