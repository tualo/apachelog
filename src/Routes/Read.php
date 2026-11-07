<?php

namespace Tualo\Office\ApacheLog\Routes;

use Tualo\Office\Basic\TualoApplication as App;
use Tualo\Office\Basic\Route as BasicRoute;
use Tualo\Office\ApacheLog\ApacheLogParser;
use Tualo\Office\ApacheLog\Scopes\ApacheLogScope;

class Read extends \Tualo\Office\Basic\RouteWrapper
{
    public static function scope(): string
    {
        return ApacheLogScope::identifier();
    }

    public static function register()
    {
        BasicRoute::add('/apachelog/read', function ($matches) {
            App::contenttype('application/json');
            try {
                $type = ($_REQUEST['type'] ?? 'access') === 'error' ? 'error' : 'access';

                $path = App::configuration(
                    'apachelog',
                    $type === 'error' ? 'errorlog' : 'accesslog',
                    $type === 'error' ? '/var/log/apache2/error.log' : '/var/log/apache2/access.log'
                );

                $limit = (int)($_REQUEST['limit'] ?? 500);
                if ($limit < 1) $limit = 1;
                if ($limit > 5000) $limit = 5000;

                $maxBytes = (int)App::configuration('apachelog', 'maxbytes', 4194304);

                $entries = ApacheLogParser::parseFile($path, $type, $limit, $maxBytes);

                App::result('data', $entries);
                App::result('total', count($entries));
                App::result('logfile', $path);
                App::result('type', $type);
                App::result('success', true);
            } catch (\Exception $e) {
                App::result('success', false);
                App::result('msg', $e->getMessage());
            }
        }, ['get', 'post'], true, [], self::scope());
    }
}
