<?php
header('Content-Type: application/json; charset=utf-8');

$config = [
    'host' => '127.0.0.1',   // prueba 127.0.0.1 si localhost falla
    'port' => 3306,
    'db'   => 'west_clean',  // usa el nombre exacto que creaste
    'user' => 'root',
    'pass' => ''             // si tu root tiene contraseña, ponla aquí
];

$dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['db']};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $config['user'], $config['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo json_encode(['ok' => true, 'msg' => 'Conexión OK', 'dsn' => $dsn]);
} catch (PDOException $e) {
    // En desarrollo local está bien devolver el mensaje para depurar
    echo json_encode(['ok' => false, 'msg' => 'DB connection failed', 'error' => $e->getMessage(), 'dsn' => $dsn]);
}
