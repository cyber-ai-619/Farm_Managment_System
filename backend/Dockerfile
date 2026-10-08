FROM php:8.2-cli-bookworm

# Install system dependencies, SSL certificates, and PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /var/www/backend

# Copy backend files
COPY . /var/www/backend/

# Render sets PORT dynamically (defaults to 10000)
ENV PORT=10000
EXPOSE 10000

CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-10000} -t public public/index.php"]
