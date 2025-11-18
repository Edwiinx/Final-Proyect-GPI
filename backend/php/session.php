<?php
// backend/php/session.php
// Manejo simple de sesión para 'me' y 'logout'.
// Coloca este archivo en backend/php/session.php

header('Content-Type: application/json; charset=utf-8');

// Responder JSON helper
function respond($ok, $payload = null, $message = null, $extra = null, $httpStatus = 200) {
    http_response_code($httpStatus);
    $resp = ['ok' => (bool)$ok];
    if ($payload !== null) $resp = array_merge($resp, (array)$payload);
    if ($message !== null) $resp['error'] = $message;
    if ($extra !== null && is_array($extra)) $resp = array_merge($resp, $extra);
    echo json_encode($resp, JSON_UNESCAPED_UNICODE);
    exit;
}

// Iniciar sesión si no está activa
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

// Lee acción (GET preferido)
$action = isset($_GET['action']) ? trim($_GET['action']) : (isset($_POST['action']) ? trim($_POST['action']) : null);

// Acción: me -> devolver info de la sesión del usuario si existe
if ($action === 'me') {
    if (!isset($_SESSION['user_id'])) {
        respond(false, null, 'No session', null, 401);
    }
    respond(true, [
        'id' => (int)$_SESSION['user_id'],
        'nombre' => $_SESSION['user_name'] ?? null,
        'correo' => $_SESSION['user_email'] ?? null,
        'tipo' => $_SESSION['user_type'] ?? null
    ]);
}

// Acción: logout -> destruir sesión y cookie
if ($action === 'logout') {
    // Limpiar variables de sesión
    $_SESSION = [];

    // Borrar cookie de sesión si existe
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    // Destruir sesión
    session_destroy();

    respond(true, ['msg' => 'Logged out']);
}

// Acción desconocida
respond(false, null, 'Unknown action', null, 400);
