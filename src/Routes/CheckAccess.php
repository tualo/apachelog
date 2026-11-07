<?php

namespace Tualo\Office\ApacheLog\Routes;

use Tualo\Office\Basic\TualoApplication as App;
use Tualo\Office\Basic\Route as BasicRoute;
use Tualo\Office\ApacheLog\Scopes\ApacheLogScope;

class CheckAccess extends \Tualo\Office\Basic\RouteWrapper
{
    public static function scope(): string
    {
        return ApacheLogScope::identifier();
    }

    public static function register()
    {
        BasicRoute::add('/apachelog/access', function () {
            App::contenttype('application/json');
            App::result('success', true);
        }, ['get'], true, [], self::scope());
    }
}
