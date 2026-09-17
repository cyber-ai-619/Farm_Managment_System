<?php

declare(strict_types=1);

/**
 * MarketModel
 *
 * Database operations for market prices and commodity pricing trends.
 */
class MarketModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getPrices(?string $commodity = null, ?string $location = null): array
    {
        $sql = 'SELECT * FROM market_prices WHERE 1=1';
        $params = [];

        if ($commodity !== null && $commodity !== '') {
            $sql .= ' AND commodity_name LIKE :commodity';
            $params[':commodity'] = '%' . $commodity . '%';
        }

        if ($location !== null && $location !== '') {
            $sql .= ' AND market_location LIKE :location';
            $params[':location'] = '%' . $location . '%';
        }

        $sql .= ' ORDER BY recorded_date DESC, commodity_name ASC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createPrice(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO market_prices (commodity_name, market_location, price_per_unit, unit, recorded_date, source, trend)
             VALUES (:commodity_name, :market_location, :price_per_unit, :unit, :recorded_date, :source, :trend)'
        );
        $stmt->execute([
            ':commodity_name'  => $data['commodity_name'],
            ':market_location' => $data['market_location'],
            ':price_per_unit'  => $data['price_per_unit'],
            ':unit'            => $data['unit'] ?? 'kg',
            ':recorded_date'   => $data['recorded_date'] ?? date('Y-m-d'),
            ':source'          => $data['source'] ?? 'Agricultural Market Board',
            ':trend'           => $data['trend'] ?? 'stable',
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function getTrends(string $commodity): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT recorded_date, market_location, price_per_unit, unit, trend
             FROM market_prices
             WHERE commodity_name LIKE :commodity
             ORDER BY recorded_date ASC'
        );
        $stmt->execute([':commodity' => '%' . $commodity . '%']);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
