<?php

namespace Tualo\Office\ApacheLog\Scopes;

use Tualo\Office\Basic\Scope;

class ApacheLogScope extends Scope
{
    protected static string $identifier = 'apachelog';
    protected static array $name = [
        'EN' => 'Apache Log',
        'DE' => 'Apache Log',
    ];
    protected static array $description = [
        'EN' => 'View Apache access and error log entries.',
        'DE' => 'Apache Access- und Error-Log Einträge anzeigen.',
    ];
}
