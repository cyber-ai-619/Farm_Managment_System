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
        $sql = 'SELECT *, commodity_name AS crop_name, market_location AS market_name, price_per_unit AS price, recorded_date AS price_date FROM market_prices WHERE 1=1';
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
        $commodityName = trim((string) ($data['commodity_name'] ?? ''));
        if ($commodityName === '' && !empty($data['crop_id'])) {
            $cropStmt = $this->pdo->prepare('SELECT name FROM crops WHERE id = :id LIMIT 1');
            $cropStmt->execute([':id' => (int) $data['crop_id']]);
            $foundName = $cropStmt->fetchColumn();
            $commodityName = $foundName ? (string) $foundName : ('Commodity #' . (int) $data['crop_id']);
        }
        if ($commodityName === '') {
            $commodityName = 'Farm Commodity';
        }

        $marketLocation = $data['market_location'] ?? ($data['market_name'] ?? 'Local Market');
        $pricePerUnit = (float) ($data['price_per_unit'] ?? ($data['price'] ?? 0));
        $recordedDate = !empty($data['recorded_date'])
            ? $data['recorded_date']
            : (!empty($data['price_date']) ? $data['price_date'] : date('Y-m-d'));

        $stmt = $this->pdo->prepare(
            'INSERT INTO market_prices (commodity_name, market_location, price_per_unit, unit, recorded_date, source, trend)
             VALUES (:commodity_name, :market_location, :price_per_unit, :unit, :recorded_date, :source, :trend)'
        );
        $stmt->execute([
            ':commodity_name'  => $commodityName,
            ':market_location' => $marketLocation,
            ':price_per_unit'  => $pricePerUnit,
            ':unit'            => !empty($data['unit']) ? $data['unit'] : 'kg',
            ':recorded_date'   => $recordedDate,
            ':source'          => !empty($data['source']) ? $data['source'] : 'Agricultural Market Board',
            ':trend'           => !empty($data['trend']) ? $data['trend'] : 'stable',
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
