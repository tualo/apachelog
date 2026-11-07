# tualo/apachelog

Apache Access-/Error-Log Viewer für tualo office (Schwester-Package zu
`tualo/modsecuritylog`).

Stellt die Einträge des Apache Access-Logs (Combined/Common Format) und
Error-Logs für Frontend-Benutzer mit dem Scope `apachelog` aufbereitet dar.

## Scope

Der Zugriff ist über den Scope **`apachelog`** geschützt. Der Scope wird über
`install-sql-bsc-scopes` registriert und muss dem Benutzer bzw. der Gruppe
zugewiesen werden.

## Routen

| Route | Methode | Beschreibung |
| --- | --- | --- |
| `/apachelog/read` | GET/POST | Letzte Log-Einträge als JSON (`type=access\|error`, `limit`, Default 500, max. 5000) |
| `/apachelog/access` | GET | Scope-Check für das Frontend |
| `/js/apachelog/lazy/...` | GET | Lazy-Loading der ExtJS-Views |

## Frontend

Panel über die Hash-Route `#apachelog/panel` (Eintrag „Apache Log").
Umschalter Access-/Error-Log, Grid mit Spaltenfiltern und Live-Filter,
Detailbereich inkl. Roh-Logzeile.

## Konfiguration

Optional in der Anwendungs-Konfiguration:

```json
{
  "apachelog": {
    "accesslog": "/var/log/apache2/access.log",
    "errorlog": "/var/log/apache2/error.log",
    "maxbytes": 4194304
  }
}
```

- `accesslog` / `errorlog`: Pfade zu den Logdateien
- `maxbytes`: maximal gelesene Bytes vom Log-Ende (Default 4 MB)

## Voraussetzungen im Container

Der PHP-FPM-User (`tualo`) braucht Leserechte auf `/var/log/apache2/*`
(`root:adm 640`). Im tualo-server-Image bereits vorhanden:

```dockerfile
RUN usermod -aG adm tualo
```
