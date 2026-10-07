<?php

declare(strict_types=1);

/**
 * WeatherApiService
 *
 * Fetches real-time weather & 7-day agricultural forecasts from Open-Meteo
 * (Free open-source weather API, no API key required).
 */
class WeatherApiService
{
    private const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

    /**
     * Fetch current weather and 7-day forecast for given coordinates.
     */
    public function getForecast(float $latitude, float $longitude): array
    {
        $params = http_build_query([
            'latitude'      => $latitude,
            'longitude'     => $longitude,
            'current'       => 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m',
            'hourly'        => 'temperature_2m,precipitation_probability,soil_temperature_0cm,soil_moisture_0_to_1cm',
            'daily'         => 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
            'timezone'      => 'auto',
            'forecast_days' => 7,
        ]);

        $url = self::BASE_URL . '?' . $params;

        $ctx = stream_context_create([
            'http' => [
                'timeout'    => 3.0,
                'user_agent' => 'FFMS-Farm-Management/1.0',
            ],
        ]);

        $json = @file_get_contents($url, false, $ctx);

        if ($json === false) {
            // Graceful fallback if offline or no internet
            return $this->mockForecast($latitude, $longitude);
        }

        $data = json_decode($json, true);
        return is_array($data) ? $data : $this->mockForecast($latitude, $longitude);
    }

    private function mockForecast(float $lat, float $lon): array
    {
        return [
            'latitude'  => $lat,
            'longitude' => $lon,
            'current'   => [
                'time'                   => date('Y-m-d\TH:i'),
                'temperature_2m'         => 24.5,
                'relative_humidity_2m'   => 58,
                'apparent_temperature'   => 25.1,
                'precipitation'          => 0.0,
                'rain'                   => 0.0,
                'weather_code'           => 1, // Mainly clear
                'wind_speed_10m'         => 12.4,
                'wind_direction_10m'     => 140,
            ],
            'daily'     => [
                'time'                          => [date('Y-m-d'), date('Y-m-d', strtotime('+1 day')), date('Y-m-d', strtotime('+2 days'))],
                'temperature_2m_max'            => [26.0, 27.5, 25.0],
                'temperature_2m_min'            => [14.0, 15.2, 13.8],
                'precipitation_sum'             => [0.0, 2.5, 8.0],
                'precipitation_probability_max' => [10, 45, 80],
            ],
            'source'    => 'offline_fallback',
        ];
    }
}
