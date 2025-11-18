<?php
// db.php - singleton PDO reuseable
declare(strict_types=1);

class Database {
    private static ?\PDO $instance = null;

    public static function get(): \PDO
    {
        if (self::$instance === null) {
            $host = '127.0.0.1';
            $db   = 'west_clean';
            $user = 'root';
            $pass = ''; // si tienes contraseña en XAMPP ponla aquí
            $charset = 'utf8mb4';
            $dsn = "mysql:host={$host};dbname={$db};charset={$charset}";
            $options = [
                \PDO::ATTR_ERRMODE            => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            self::$instance = new \PDO($dsn, $user, $pass, $options);
        }
        return self::$instance;
    }
}
