<?php
$config = require __DIR__ . '/config.php';
date_default_timezone_set($config['app']['timezone']);
ini_set('session.use_strict_mode', '1');
session_name($config['app']['session_name']);
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>!empty($_SERVER['HTTPS']),'httponly'=>true,'samesite'=>'Lax']);
    session_start();
}
spl_autoload_register(function ($class) {
    foreach (['controllers','models','middleware'] as $dir) {
        $file = __DIR__ . '/../' . $dir . '/' . $class . '.php';
        if (is_file($file)) { require_once $file; return; }
    }
});
require_once __DIR__ . '/../helpers/functions.php';
$GLOBALS['config'] = $config;
