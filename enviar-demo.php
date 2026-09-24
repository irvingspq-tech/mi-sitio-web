<?php
/**
 * TrackIO — enviar-demo.php
 *
 * Procesa el formulario "Solicita tu demo gratuita" (#demo-form) de index.html.
 * Envía dos correos vía SMTP autenticado con PHPMailer:
 *   1) Al destinatario principal, con todos los datos capturados.
 *   2) A la lista de aviso, solo con nombre, empresa y contacto.
 *
 * Requiere PHP con la extensión OpenSSL habilitada (estándar en Hostinger).
 * No requiere Composer: las librerías de PHPMailer están en lib/phpmailer/.
 */

declare(strict_types=1);

require __DIR__ . '/lib/phpmailer/Exception.php';
require __DIR__ . '/lib/phpmailer/PHPMailer.php';
require __DIR__ . '/lib/phpmailer/SMTP.php';

use PHPMailer\PHPMailer\Exception as PHPMailerException;
use PHPMailer\PHPMailer\PHPMailer;

header('Content-Type: application/json; charset=utf-8');

/* =========================================================================
 * CONFIGURACIÓN — rellenar antes de subir a producción
 * ========================================================================= */

// Datos de la cuenta de correo que ENVÍA (contactotrackio@viveenergia.com).
// Estos son credenciales de buzón de correo, no las de WordPress ni FTP.
const SMTP_HOST = 'smtp.office365.com';         // Microsoft 365 / Office 365
const SMTP_PORT = 587;                          // 587 = STARTTLS
const SMTP_ENCRYPTION = 'TLS';                  // 'tls' para el puerto 587, 'ssl' para el 465
const SMTP_USER = 'contactotrackio@viveenergia.com';
const SMTP_PASS = 'CTrV&219+_+26!';    // ← pon aquí la contraseña real del buzón (edítalo tú, localmente)

// Destinatarios.
const PRIMARY_RECIPIENT = 'contactotrackio@viveenergia.com';
const NOTICE_RECIPIENTS = [
    'l.vazquez@viveenergia.com',
    'c.arechederra@viveenergia.com',
    'is.quintal@viveenergia.com',
];

/* =========================================================================
 * Solo aceptar POST
 * ========================================================================= */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

/* =========================================================================
 * Honeypot anti-spam: si el campo oculto viene lleno, es un bot.
 * Respondemos éxito falso para no delatar la protección.
 * ========================================================================= */

if (trim((string) ($_POST['sitio_web'] ?? '')) !== '') {
    echo json_encode(['ok' => true]);
    exit;
}

/* =========================================================================
 * Helpers
 * ========================================================================= */

function clean_field(string $value, int $maxLength = 255): string
{
    $value = trim($value);
    $value = str_replace(["\r", "\n"], ' ', $value); // evita inyección de cabeceras de correo
    return mb_substr($value, 0, $maxLength);
}

function is_valid_email(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function build_mailer(): PHPMailer
{
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASS;
    $mail->SMTPSecure = SMTP_ENCRYPTION;
    $mail->Port = SMTP_PORT;
    $mail->CharSet = 'UTF-8';
    $mail->SMTPDebug = 2;
    $mail->Debugoutput = function ($str, $level) {
        error_log('[TrackIO SMTP] ' . trim($str));
    };
    $mail->setFrom(SMTP_USER, 'TrackIO — Formulario web');
    return $mail;
}

/* =========================================================================
 * Recolectar y validar los datos del formulario
 * ========================================================================= */

$nombre = clean_field((string) ($_POST['nombre'] ?? ''));
$empresa = clean_field((string) ($_POST['empresa'] ?? ''));
$email = clean_field((string) ($_POST['email'] ?? ''));
$telefono = clean_field((string) ($_POST['telefono'] ?? ''), 60);
$mensaje = mb_substr(trim((string) ($_POST['mensaje'] ?? '')), 0, 1000);

$missing = [];
if ($nombre === '') {
    $missing[] = 'nombre';
}
if ($empresa === '') {
    $missing[] = 'empresa';
}
if (!is_valid_email($email)) {
    $missing[] = 'email';
}

if ($missing !== []) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'validation', 'fields' => $missing]);
    exit;
}

/* =========================================================================
 * Enviar los dos correos
 * ========================================================================= */

$fechaHora = date('d/m/Y H:i');

try {
    // ---- Correo 1: destinatario principal, datos completos ----
    $mailPrincipal = build_mailer();
    $mailPrincipal->addAddress(PRIMARY_RECIPIENT);
    $mailPrincipal->addReplyTo($email, $nombre);
    $mailPrincipal->isHTML(true);
    $mailPrincipal->Subject = 'Nueva solicitud de demo — ' . $empresa;
    $mailPrincipal->Body = '
        <h2 style="font-family:sans-serif;">Nueva solicitud de demo — TrackIO</h2>
        <p><strong>Nombre:</strong> ' . htmlspecialchars($nombre) . '</p>
        <p><strong>Empresa:</strong> ' . htmlspecialchars($empresa) . '</p>
        <p><strong>Correo:</strong> ' . htmlspecialchars($email) . '</p>
        <p><strong>Teléfono:</strong> ' . htmlspecialchars($telefono !== '' ? $telefono : '—') . '</p>
        <p><strong>Mensaje:</strong><br>' . nl2br(htmlspecialchars($mensaje !== '' ? $mensaje : '—')) . '</p>
        <hr>
        <p style="color:#888; font-size:12px;">Recibido el ' . $fechaHora . ' vía el formulario de trackio-smart-energy.</p>
    ';
    $mailPrincipal->AltBody = "Nombre: $nombre\nEmpresa: $empresa\nCorreo: $email\nTeléfono: $telefono\nMensaje: $mensaje";
    $mailPrincipal->send();

    // ---- Correo 2: lista de aviso, solo datos mínimos ----
    $mailAviso = build_mailer();
    foreach (NOTICE_RECIPIENTS as $addr) {
        $mailAviso->addAddress($addr);
    }
    $mailAviso->isHTML(true);
    $mailAviso->Subject = 'Aviso: nueva solicitud de demo — ' . $empresa;
    $contactoLinea = $email . ($telefono !== '' ? ' · ' . $telefono : '');
    $mailAviso->Body = '
        <h2 style="font-family:sans-serif;">Nueva solicitud de demo (aviso)</h2>
        <p><strong>Nombre:</strong> ' . htmlspecialchars($nombre) . '</p>
        <p><strong>Empresa:</strong> ' . htmlspecialchars($empresa) . '</p>
        <p><strong>Contacto:</strong> ' . htmlspecialchars($contactoLinea) . '</p>
        <p style="color:#888; font-size:12px;">Detalle completo enviado a ' . PRIMARY_RECIPIENT . '.</p>
    ';
    $mailAviso->AltBody = "Nombre: $nombre\nEmpresa: $empresa\nContacto: $contactoLinea";
    $mailAviso->send();

    echo json_encode(['ok' => true]);
} catch (PHPMailerException $e) {
    error_log('[TrackIO] Error enviando formulario de demo: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'send_failed']);
}
