<?php
// backend/php/logica.php
// Responde JSON para acciones: login, register, logout, me
// Ajusta credenciales/host si tu entorno difiere.

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *"); // ajustar en producción
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // CORS preflight
    exit;
}

// start session only if not started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// CONFIG - cambia si es necesario
$dbHost = '127.0.0.1';
$dbPort = 3306;
$dbName = 'west_clean';
$dbUser = 'root';
$dbPass = ''; // si tu root tiene password, colócalo aquí

$dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";

/**
 * Util helper para responder JSON y terminar ejecución
 */
function respond($ok, $payload = [], $errorMsg = null, $detail = null, $httpStatus = 200) {
    http_response_code($httpStatus);
    $out = ['ok' => $ok];
    if ($ok) {
        if (!empty($payload)) $out['data'] = $payload;
    } else {
        $out['error'] = $errorMsg ?: 'Unknown error';
        if ($detail !== null) $out['detail'] = $detail; // para dev local
    }
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
    exit;
}

// Connect PDO
try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    respond(false, null, 'DB connection error', $e->getMessage(), 500);
}

/**
 * Sanitize helper (light)
 */
function clean($v) {
    return is_string($v) ? trim($v) : $v;
}

$action = isset($_GET['action']) ? $_GET['action'] : null;
if (!$action) {
    respond(false, null, 'No action provided', null, 400);
}

/* -----------------------
   ACTION: login
   expects POST: email (or username), password
   ----------------------- */
if ($action === 'login') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(false, null, 'Invalid method, POST required', null, 405);
    }

    $email = clean($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email === '' || $password === '') {
        respond(false, null, 'Email and password required', null, 400);
    }

    try {
        // Query: buscar por correo o por usuario (si quieres permitir login por usuario)
        $sql = "SELECT id, nombre, usuario, correo, contrasena, tipo, foto_perfil
                FROM usuarios
                WHERE correo = :identifier OR usuario = :identifier
                LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':identifier', $email, PDO::PARAM_STR);
        $stmt->execute();
        $user = $stmt->fetch();

        if (!$user) {
            respond(false, null, 'Usuario no encontrado', null, 401);
        }

        $stored = $user['contrasena'];

        // Primero intentamos password_verify (hash moderno)
        $verified = false;
        if (password_verify($password, $stored)) {
            $verified = true;
        } else {
            // Fallback para contraseñas en texto plano (sólo en migración local):
            if ($password === $stored) {
                $verified = true;
                // Re-hash y actualizar la contraseña en DB para seguridad
                try {
                    $newHash = password_hash($password, PASSWORD_DEFAULT);
                    $uupd = $pdo->prepare("UPDATE usuarios SET contrasena = :h WHERE id = :id");
                    $uupd->execute([':h' => $newHash, ':id' => $user['id']]);
                    // opcional: sobrescribir local variable
                    $stored = $newHash;
                } catch (Exception $e) {
                    // No fatal; continuar con login exitoso pero reportamos detalle si dev
                }
            }
        }

        if (!$verified) {
            respond(false, null, 'Contraseña incorrecta', null, 401);
        }

        // Login OK: Set session
        $_SESSION['user_id'] = (int)$user['id'];
        $_SESSION['user_name'] = $user['nombre'];
        $_SESSION['user_usuario'] = $user['usuario'] ?? null;
        $_SESSION['user_email'] = $user['correo'];
        $_SESSION['user_type'] = $user['tipo'];
        $_SESSION['user_avatar'] = $user['foto_perfil'] ?? null;
        session_regenerate_id(true);

        respond(true, [
            'id' => (int)$user['id'],
            'nombre' => $user['nombre'],
            'correo' => $user['correo'],
            'tipo' => $user['tipo']
        ]);
    } catch (PDOException $e) {
        respond(false, null, 'Server error', $e->getMessage(), 500);
    }
}

/* -----------------------
   ACTION: register
   expects POST: name, email, password, (optional) usuario
   ----------------------- */
if ($action === 'register') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(false, null, 'Invalid method, POST required', null, 405);
    }

    $nombre = clean($_POST['name'] ?? $_POST['nombre'] ?? '');
    $email  = clean($_POST['email'] ?? '');
    $usuario = clean($_POST['usuario'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($nombre === '' || $email === '' || $password === '') {
        respond(false, null, 'Nombre, email y contraseña son requeridos', null, 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(false, null, 'Email inválido', null, 400);
    }

    if (strlen($password) < 6) {
        respond(false, null, 'La contraseña debe tener al menos 6 caracteres', null, 400);
    }

    // crear usuario
    try {
        // verificar duplicados (correo o usuario)
        $q = "SELECT COUNT(*) as cnt FROM usuarios WHERE correo = :email OR usuario = :usuario";
        $stmt = $pdo->prepare($q);
        $stmt->execute([':email' => $email, ':usuario' => $usuario ?: $email]);
        $row = $stmt->fetch();
        if ($row && $row['cnt'] > 0) {
            respond(false, null, 'Correo o usuario ya registrado', null, 409);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $ins = $pdo->prepare("INSERT INTO usuarios (nombre, usuario, correo, contrasena) VALUES (:nombre, :usuario, :correo, :contrasena)");
        $ins->execute([
            ':nombre' => $nombre,
            ':usuario' => $usuario ?: $email,
            ':correo' => $email,
            ':contrasena' => $hash
        ]);

        $newId = (int)$pdo->lastInsertId();
        respond(true, ['id' => $newId, 'nombre' => $nombre, 'correo' => $email]);
    } catch (PDOException $e) {
        respond(false, null, 'Server error', $e->getMessage(), 500);
    }
}

/* -----------------------
   ACTION: logout
   ----------------------- */
if ($action === 'logout') {
    // destruir sesión
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    respond(true, ['msg' => 'Logged out']);
}

/* -----------------------
   ACTION: me  (obtener info de sesión)
   ----------------------- */
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

respond(false, null, 'Unknown action', null, 400);
