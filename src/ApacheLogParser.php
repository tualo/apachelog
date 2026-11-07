<?php

namespace Tualo\Office\ApacheLog;

/**
 * Parser für Apache-Logdateien.
 *
 * Unterstützt:
 *  - Access-Log im Combined- und Common-Format
 *      %h %l %u %t "%r" %>s %O ["%{Referer}i" "%{User-Agent}i"]
 *  - Error-Log im Apache-2.4-Format
 *      [Tag Monat TT HH:MM:SS.uuuuuu JJJJ] [modul:level] [pid N:tid N] [client IP:PORT] Meldung
 */
class ApacheLogParser
{
    /**
     * Liest die letzten $maxBytes der Datei und liefert maximal $limit
     * Einträge, neueste zuerst.
     *
     * @param string $type 'access' oder 'error'
     */
    public static function parseFile(string $path, string $type = 'access', int $limit = 500, int $maxBytes = 4194304): array
    {
        if (!is_file($path)) {
            throw new \Exception('log file not found: ' . $path);
        }
        if (!is_readable($path)) {
            throw new \Exception('log file not readable: ' . $path);
        }

        $size = filesize($path);
        $offset = max(0, $size - $maxBytes);
        $fp = fopen($path, 'r');
        if ($fp === false) {
            throw new \Exception('could not open log file: ' . $path);
        }
        if ($offset > 0) {
            fseek($fp, $offset);
            fgets($fp); // angeschnittene erste Zeile verwerfen
        }
        $content = stream_get_contents($fp);
        fclose($fp);
        if ($content === false) {
            throw new \Exception('could not read log file: ' . $path);
        }

        $entries = self::parseString($content, $type);
        $entries = array_reverse($entries);
        if (count($entries) > $limit) {
            $entries = array_slice($entries, 0, $limit);
        }
        return $entries;
    }

    public static function parseString(string $content, string $type = 'access'): array
    {
        $entries = [];
        $lines = preg_split("/\r\n|\n|\r/", $content);
        foreach ($lines as $line) {
            if (trim($line) === '') {
                continue;
            }
            $entry = $type === 'error'
                ? self::parseErrorLine($line)
                : self::parseAccessLine($line);
            if (!is_null($entry)) {
                $entries[] = $entry;
            }
        }
        return $entries;
    }

    /**
     * Combined/Common-Log-Zeile, z. B.
     * 1.2.3.4 - frank [07/Nov/2026:08:44:00 +0000] "GET /index.html HTTP/1.1" 200 2326 "http://ref/" "Mozilla/5.0"
     */
    public static function parseAccessLine(string $line): ?array
    {
        $pattern = '/^(\S+)\s+(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+"([^"]*)"\s+(\d{3}|-)\s+(\S+)(?:\s+"((?:[^"\\\\]|\\\\.)*)"\s+"((?:[^"\\\\]|\\\\.)*)")?/';
        if (!preg_match($pattern, $line, $m)) {
            return null;
        }

        $method = '';
        $uri = '';
        $protocol = '';
        if (preg_match('#^(\S+)\s+(\S+)(?:\s+(\S+))?$#', $m[5], $r)) {
            $method = $r[1];
            $uri = $r[2];
            $protocol = $r[3] ?? '';
        } else {
            $uri = $m[5];
        }

        return [
            'type' => 'access',
            'timestamp' => self::normalizeAccessTimestamp($m[4]),
            'client_ip' => $m[1],
            'user' => $m[3] === '-' ? '' : $m[3],
            'method' => $method,
            'uri' => $uri,
            'protocol' => $protocol,
            'status' => $m[6] === '-' ? null : (int)$m[6],
            'bytes' => $m[7] === '-' ? null : (int)$m[7],
            'referer' => isset($m[8]) && $m[8] !== '-' ? stripcslashes($m[8]) : '',
            'user_agent' => isset($m[9]) && $m[9] !== '-' ? stripcslashes($m[9]) : '',
            'module' => '',
            'level' => '',
            'pid' => '',
            'message' => '',
            'raw' => $line,
        ];
    }

    /**
     * Error-Log-Zeile, z. B.
     * [Fri Nov 07 08:26:00.123456 2026] [proxy:error] [pid 42:tid 139] [client 1.2.3.4:5678] AH00957: ...
     */
    public static function parseErrorLine(string $line): ?array
    {
        $pattern = '/^\[([^\]]+)\]\s+\[([^\]]*)\]\s+(?:\[pid\s+(\d+)(?::tid\s+\d+)?\]\s+)?(?:\[client\s+([^\]]+)\]\s+)?(.*)$/';
        if (!preg_match($pattern, $line, $m)) {
            // Zeilen ohne Header (z. B. Stacktraces) als reine Meldung aufnehmen
            return [
                'type' => 'error',
                'timestamp' => '',
                'client_ip' => '',
                'user' => '',
                'method' => '',
                'uri' => '',
                'protocol' => '',
                'status' => null,
                'bytes' => null,
                'referer' => '',
                'user_agent' => '',
                'module' => '',
                'level' => '',
                'pid' => '',
                'message' => $line,
                'raw' => $line,
            ];
        }

        $module = $m[2];
        $level = '';
        $colon = strrpos($module, ':');
        if ($colon !== false) {
            $level = substr($module, $colon + 1);
            $module = substr($module, 0, $colon);
        } else {
            $level = $module;
            $module = '';
        }

        $clientIp = '';
        if (isset($m[4]) && $m[4] !== '') {
            // Port abtrennen (IPv4 "1.2.3.4:5678" bzw. IPv6 "[::1]:5678")
            if (preg_match('/^(.*):\d+$/', $m[4], $c)) {
                $clientIp = trim($c[1], '[]');
            } else {
                $clientIp = $m[4];
            }
        }

        return [
            'type' => 'error',
            'timestamp' => self::normalizeErrorTimestamp($m[1]),
            'client_ip' => $clientIp,
            'user' => '',
            'method' => '',
            'uri' => '',
            'protocol' => '',
            'status' => null,
            'bytes' => null,
            'referer' => '',
            'user_agent' => '',
            'module' => $module,
            'level' => $level,
            'pid' => $m[3] ?? '',
            'message' => $m[5],
            'raw' => $line,
        ];
    }

    private static function normalizeAccessTimestamp(string $ts): string
    {
        $dt = \DateTime::createFromFormat('d/M/Y:H:i:s P', $ts);
        if ($dt !== false) {
            return $dt->format('Y-m-d H:i:s');
        }
        return $ts;
    }

    private static function normalizeErrorTimestamp(string $ts): string
    {
        // Format: Fri Nov 07 08:26:00.123456 2026 (Mikrosekunden optional)
        $formats = ['D M d H:i:s.u Y', 'D M d H:i:s Y'];
        foreach ($formats as $format) {
            $dt = \DateTime::createFromFormat($format, $ts);
            if ($dt !== false) {
                return $dt->format('Y-m-d H:i:s');
            }
        }
        return $ts;
    }
}
