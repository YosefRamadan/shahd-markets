<?php
class Database
{
    private static ?PDO $pdo = null;
    public static function pdo(): PDO
    {
        if (self::$pdo) return self::$pdo;
        $db = $GLOBALS['config']['db'];
        $dsn = "mysql:host={$db['host']};dbname={$db['database']};charset={$db['charset']}";
        self::$pdo = new PDO($dsn, $db['username'], $db['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        return self::$pdo;
    }
}
