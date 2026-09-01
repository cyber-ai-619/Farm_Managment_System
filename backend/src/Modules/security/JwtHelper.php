<?php

declare(strict_types=1);

/**
 * JwtHelper
 *
 * A zero-dependency JWT implementation using HMAC-SHA256.
 * Tokens are valid for TOKEN_TTL seconds (default 8 hours).
 */
class JwtHelper
{
    private const ALGO   = 'sha256';
    private const TTL    = 28800; // 8 hours in seconds

    // ---------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------

    /**
     * Generate a signed JWT for a given user payload.
     *
     * @param array $payload  Any data to embed (e.g. user id, role).
     * @return string         The signed token string.
     */
    public static function generate(array $payload): string
    {
        $header = self::base64url(json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ]));

        $payload['iat'] = time();
        $payload['exp'] = time() + self::TTL;

        $body = self::base64url(json_encode($payload));
        $signature = self::sign("{$header}.{$body}");

        return "{$header}.{$body}.{$signature}";
    }

    /**
     * Verify a token and return its decoded payload, or null if invalid/expired.
     *
     * @param string $token
     * @return array|null
     */
    public static function verify(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $body, $signature] = $parts;

        // Verify signature
        $expected = self::sign("{$header}.{$body}");
        if (!hash_equals($expected, $signature)) {
            return null;
        }

        $payload = json_decode(self::base64urlDecode($body), true);
        if (!is_array($payload)) {
            return null;
        }

        // Check expiry
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null; // Token expired
        }

        return $payload;
    }

    /**
     * Extract the Bearer token from the Authorization header.
     *
     * @return string|null
     */
    public static function fromHeader(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';

        if (str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
        }

        return null;
    }

    // ---------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------

    private static function sign(string $data): string
    {
        $secret = $_ENV['APP_SECRET'] ?? getenv('APP_SECRET') ?: 'ffms-dev-secret-change-in-production';
        return self::base64url(hash_hmac(self::ALGO, $data, $secret, true));
    }

    private static function base64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64urlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
