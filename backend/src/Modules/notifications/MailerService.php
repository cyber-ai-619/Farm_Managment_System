<?php

declare(strict_types=1);

/**
 * MailerService
 *
 * Handles transactional email delivery for Farm Management System (FFMS).
 * Supports:
 *   - 'smtp'  : Native PHP socket SMTP over TLS/SSL (e.g. Gmail SMTP with App Password, Brevo SMTP)
 *   - 'brevo' : Brevo HTTP REST API (port 443 via cURL, ideal if outbound SMTP ports are blocked)
 *   - 'log'   : Safe fallback driver logging emails to file / error_log (ideal for local development)
 */
class MailerService
{
    private string $driver;
    private string $host;
    private int    $port;
    private string $encryption;
    private string $username;
    private string $password;
    private string $fromAddress;
    private string $fromName;
    private string $frontendUrl;
    private string $brevoApiKey;

    public function __construct()
    {
        $this->driver      = strtolower((string) ($_ENV['MAIL_DRIVER'] ?? getenv('MAIL_DRIVER') ?: 'smtp'));
        $this->host        = (string) ($_ENV['MAIL_HOST'] ?? getenv('MAIL_HOST') ?: 'smtp.gmail.com');
        $this->port        = (int) ($_ENV['MAIL_PORT'] ?? getenv('MAIL_PORT') ?: 587);
        $this->encryption  = strtolower((string) ($_ENV['MAIL_ENCRYPTION'] ?? getenv('MAIL_ENCRYPTION') ?: 'tls'));
        $this->username    = (string) ($_ENV['MAIL_USERNAME'] ?? getenv('MAIL_USERNAME') ?: '');
        $this->password    = (string) ($_ENV['MAIL_PASSWORD'] ?? getenv('MAIL_PASSWORD') ?: '');
        $this->fromAddress = (string) ($_ENV['MAIL_FROM_ADDRESS'] ?? getenv('MAIL_FROM_ADDRESS') ?: ($this->username ?: 'noreply@farm-system.local'));
        $this->fromName    = (string) ($_ENV['MAIL_FROM_NAME'] ?? getenv('MAIL_FROM_NAME') ?: 'Farm Management System');
        $this->frontendUrl = rtrim((string) ($_ENV['FRONTEND_URL'] ?? getenv('FRONTEND_URL') ?: 'http://localhost:5173'), '/');
        $this->brevoApiKey = (string) ($_ENV['BREVO_API_KEY'] ?? getenv('BREVO_API_KEY') ?: '');
    }

    /**
     * Send email verification link for newly requesting farm owners (24h expiry)
     */
    public function sendRegistrationVerification(string $toEmail, string $name, string $verifyToken): bool
    {
        $link = "{$this->frontendUrl}/register?verify_token={$verifyToken}&email=" . urlencode($toEmail);
        $subject = '🌾 Confirm your email — Farm Management System';

        $headline = 'Confirm Your Email to Get Started';
        $intro = "Hello {$name},<br><br>Thank you for signing up for the Farm Management System. Please confirm your email address to complete your registration, secure your farm workspace, and choose your account password.";
        $ctaText = 'Confirm Email & Set Password';
        $note = 'For your security, this verification link will expire in <strong>24 hours</strong>. If you did not create an account on the Farm Management System, you can safely ignore this email.';

        $html = $this->renderHtmlTemplate($headline, $intro, $link, $ctaText, $note);
        $text = "Hello {$name},\n\nPlease confirm your email address to set your password and activate your farm account:\n{$link}\n\nThis link will expire in 24 hours.\nIf you did not request this, please ignore this email.";

        return $this->send($toEmail, $name, $subject, $html, $text);
    }

    /**
     * Send password reset link (10 minutes expiry)
     */
    public function sendPasswordReset(string $toEmail, string $name, string $resetToken): bool
    {
        $link = "{$this->frontendUrl}/reset-password?token={$resetToken}&email=" . urlencode($toEmail);
        $subject = '🔒 Password Reset Request — Farm Management System';

        $headline = 'Reset Your Password';
        $intro = "Hello {$name},<br><br>We received a request to reset your password for your Farm Management System account. Click the button below to choose a new password.";
        $ctaText = 'Reset My Password';
        $note = '⚠️ <strong>Urgent:</strong> This password reset link is strictly valid for <strong>10 minutes</strong>. If you did not request a password reset, no action is needed and your account remains secure.';

        $html = $this->renderHtmlTemplate($headline, $intro, $link, $ctaText, $note, '#dc2626');
        $text = "Hello {$name},\n\nWe received a request to reset your password. Use the following link within 10 minutes:\n{$link}\n\nIf you did not make this request, you can safely ignore this email.";

        return $this->send($toEmail, $name, $subject, $html, $text);
    }

    /**
     * Send team invitation link (24h expiry)
     */
    public function sendTeamInvitation(string $toEmail, string $name, string $farmName, string $roleName, string $inviteToken): bool
    {
        $link = "{$this->frontendUrl}/register?invite={$inviteToken}&email=" . urlencode($toEmail);
        $subject = "🚜 You've been invited to join {$farmName} on Farm Management System";

        $headline = 'Welcome to the Farm Team!';
        $intro = "Hello {$name},<br><br>You have been invited to join <strong>{$farmName}</strong> as a <strong>" . htmlspecialchars(ucwords(str_replace('_', ' ', $roleName))) . "</strong> on the Farm Management System.<br>Please accept the invitation below to set up your password and access your workspace.";
        $ctaText = 'Accept Invitation & Join Team';
        $note = 'This invitation link is valid for <strong>24 hours</strong>. If you have questions about your role, please contact your farm administrator.';

        $html = $this->renderHtmlTemplate($headline, $intro, $link, $ctaText, $note);
        $text = "Hello {$name},\n\nYou have been invited to join {$farmName} as a {$roleName}.\nAccept your invite and set your password here:\n{$link}\n\nThis link will expire in 24 hours.";

        return $this->send($toEmail, $name, $subject, $html, $text);
    }

    /**
     * Dispatches email via selected driver with graceful fallback logging
     */
    public function send(string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody): bool
    {
        // If driver is explicitly 'log' or credentials are not configured, log and return true
        if ($this->driver === 'log' || 
            ($this->driver === 'smtp' && empty($this->password)) ||
            ($this->driver === 'brevo' && empty($this->brevoApiKey))) {
            $this->logEmailLocally($toEmail, $subject, $textBody);
            return true;
        }

        try {
            if ($this->driver === 'brevo' && !empty($this->brevoApiKey)) {
                return $this->sendViaBrevoApi($toEmail, $toName, $subject, $htmlBody, $textBody);
            }

            return $this->sendViaSocketSmtp($toEmail, $toName, $subject, $htmlBody, $textBody);
        } catch (\Throwable $e) {
            error_log("[MailerService] Email send error to {$toEmail}: " . $e->getMessage());
            // Fallback: log the email content so links are never lost
            $this->logEmailLocally($toEmail, $subject, $textBody);
            return false;
        }
    }

    /**
     * Send email using native PHP socket SMTP (supports TLS/SSL, Gmail SMTP)
     */
    private function sendViaSocketSmtp(string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody): bool
    {
        $timeout = 15;
        $remote = ($this->encryption === 'ssl' ? 'ssl://' : 'tcp://') . $this->host . ':' . $this->port;
        
        $socket = @stream_socket_client($remote, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT);
        if (!$socket) {
            throw new \RuntimeException("Could not connect to SMTP host {$remote}: {$errstr} ({$errno})");
        }

        stream_set_timeout($socket, $timeout);

        $this->readSmtpResponse($socket, '220');

        $clientHost = gethostname() ?: 'localhost';
        $this->writeSmtpCommand($socket, "EHLO {$clientHost}", '250');

        // Upgrade to TLS if required
        if ($this->encryption === 'tls') {
            $this->writeSmtpCommand($socket, "STARTTLS", '220');
            $cryptoMethod = STREAM_CRYPTO_METHOD_TLS_CLIENT;
            if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) {
                $cryptoMethod |= STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
            }
            if (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT')) {
                $cryptoMethod |= STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;
            }

            if (!stream_socket_enable_crypto($socket, true, $cryptoMethod)) {
                fclose($socket);
                throw new \RuntimeException("TLS negotiation failed with {$this->host}");
            }
            $this->writeSmtpCommand($socket, "EHLO {$clientHost}", '250');
        }

        // Authenticate if username and password provided
        if (!empty($this->username) && !empty($this->password)) {
            $this->writeSmtpCommand($socket, "AUTH LOGIN", '334');
            $this->writeSmtpCommand($socket, base64_encode($this->username), '334');
            $this->writeSmtpCommand($socket, base64_encode($this->password), '235');
        }

        $this->writeSmtpCommand($socket, "MAIL FROM:<{$this->fromAddress}>", '250');
        $this->writeSmtpCommand($socket, "RCPT TO:<{$toEmail}>", '250');
        $this->writeSmtpCommand($socket, "DATA", '354');

        $boundary = '=_boundary_' . md5((string) microtime(true));
        $cleanToName = preg_replace('/[^\w\s-]/', '', $toName);
        $cleanFromName = preg_replace('/[^\w\s-]/', '', $this->fromName);

        $headers = [];
        $headers[] = "From: =?UTF-8?B?" . base64_encode($cleanFromName) . "?= <{$this->fromAddress}>";
        $headers[] = "To: =?UTF-8?B?" . base64_encode($cleanToName) . "?= <{$toEmail}>";
        $headers[] = "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=";
        $headers[] = "MIME-Version: 1.0";
        $headers[] = "Date: " . date('r');
        $headers[] = "Message-ID: <" . md5(uniqid((string) mt_rand(), true)) . "@" . ($this->host) . ">";
        $headers[] = "Content-Type: multipart/alternative; boundary=\"{$boundary}\"";

        $messageBody  = implode("\r\n", $headers) . "\r\n\r\n";
        $messageBody .= "--{$boundary}\r\n";
        $messageBody .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $messageBody .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $messageBody .= chunk_split(base64_encode($textBody)) . "\r\n";
        $messageBody .= "--{$boundary}\r\n";
        $messageBody .= "Content-Type: text/html; charset=UTF-8\r\n";
        $messageBody .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $messageBody .= chunk_split(base64_encode($htmlBody)) . "\r\n";
        $messageBody .= "--{$boundary}--\r\n";
        $messageBody .= ".";

        $this->writeSmtpCommand($socket, $messageBody, '250');
        $this->writeSmtpCommand($socket, "QUIT", '221');

        fclose($socket);
        return true;
    }

    /**
     * Send email via Brevo REST API (HTTPS port 443 via cURL)
     */
    private function sendViaBrevoApi(string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody): bool
    {
        $payload = [
            'sender' => [
                'name'  => $this->fromName,
                'email' => $this->fromAddress,
            ],
            'to' => [
                [
                    'email' => $toEmail,
                    'name'  => $toName,
                ]
            ],
            'subject'     => $subject,
            'htmlContent' => $htmlBody,
            'textContent' => $textBody,
        ];

        $ch = curl_init('https://api.brevo.com/v3/smtp/email');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'accept: application/json',
            'api-key: ' . $this->brevoApiKey,
            'content-type: application/json',
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new \RuntimeException("Brevo cURL error: " . $curlError);
        }

        if ($httpCode >= 200 && $httpCode < 300) {
            return true;
        }

        throw new \RuntimeException("Brevo API returned HTTP {$httpCode}: {$response}");
    }

    private function readSmtpResponse($socket, string $expectedCode): string
    {
        $response = '';
        while (!feof($socket)) {
            $line = fgets($socket, 1024);
            if ($line === false) break;
            $response .= $line;
            // 4th char is space when final response line is reached (e.g. "250 OK" vs "250-STARTTLS")
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }

        if (!str_starts_with(trim($response), $expectedCode)) {
            throw new \RuntimeException("SMTP unexpected response: " . trim($response) . " (expected {$expectedCode})");
        }

        return $response;
    }

    private function writeSmtpCommand($socket, string $command, string $expectedCode): string
    {
        fwrite($socket, $command . "\r\n");
        return $this->readSmtpResponse($socket, $expectedCode);
    }

    /**
     * Fallback and local development logger
     */
    private function logEmailLocally(string $toEmail, string $subject, string $textBody): void
    {
        $logDir = __DIR__ . '/../../../../scratch/email_logs';
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0777, true);
        }

        $logEntry = sprintf(
            "[%s] TO: %s | SUBJECT: %s\n%s\n%s\n\n",
            date('Y-m-d H:i:s'),
            $toEmail,
            $subject,
            str_repeat('-', 60),
            $textBody
        );

        @file_put_contents($logDir . '/dispatched_emails.log', $logEntry, FILE_APPEND);
        error_log("[MailerService DISPATCHED]: To {$toEmail} | Subject: {$subject}");
    }

    /**
     * Renders a responsive, clean, branded HTML email
     */
    private function renderHtmlTemplate(string $headline, string $intro, string $ctaLink, string $ctaText, string $note, string $btnBg = '#16a34a'): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #14532d; padding: 28px 32px; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 24px; vertical-align: middle; margin-right: 8px;">🌾</span>
                    <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; vertical-align: middle;">Farm Management System</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em;">{$headline}</h1>
              <div style="font-size: 15px; color: #334155; margin-bottom: 28px; line-height: 1.6;">
                {$intro}
              </div>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: {$btnBg};">
                    <a href="{$ctaLink}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: 0.01em;">
                      {$ctaText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Plain link fallback -->
              <div style="background-color: #f8fafc; border-left: 3px solid #cbd5e1; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #64748b; word-break: break-all;">
                If the button above does not work, copy and paste this link into your browser:<br>
                <a href="{$ctaLink}" style="color: #15803d; text-decoration: underline;">{$ctaLink}</a>
              </div>

              <!-- Security/Expiration Note -->
              <div style="font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; line-height: 1.5;">
                {$note}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
              &copy; " . date('Y') . " Farm Management System (FFMS). All rights reserved.<br>
              Automated system notification &bull; Please do not reply directly to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }
}
