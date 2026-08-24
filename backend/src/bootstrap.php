<?php

declare(strict_types=1);

function respond(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

function farm_module_catalog(): array
{
    return [
        [
            'key' => 'farm_field',
            'label' => 'Farm and Field Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'crop',
            'label' => 'Crop Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'irrigation',
            'label' => 'Irrigation and Water Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'livestock',
            'label' => 'Livestock Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'inventory',
            'label' => 'Farm Inventory and Inputs',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'equipment',
            'label' => 'Farm Equipment and Machinery',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'labour',
            'label' => 'Labour and Employee Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'pest_disease',
            'label' => 'Pest and Disease Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'weather',
            'label' => 'Weather and Environmental Monitoring',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'harvest',
            'label' => 'Harvest Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'sales_market',
            'label' => 'Market and Sales Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'finance',
            'label' => 'Financial Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'suppliers_procurement',
            'label' => 'Supplier and Procurement Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'storage',
            'label' => 'Storage and Post-Harvest Management',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'analytics',
            'label' => 'Dashboard and Analytics',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'notifications',
            'label' => 'Notifications and Alerts',
            'status' => 'scaffolded',
        ],
        [
            'key' => 'security',
            'label' => 'Security and User Management',
            'status' => 'scaffolded',
        ],
    ];
}

