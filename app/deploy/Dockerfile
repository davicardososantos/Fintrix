# deploy/Dockerfile

# stage 1: build stage
FROM php:8.3-fpm-alpine as build

# Install system dependencies and php extensions
RUN apk add --no-cache --update \
    zip \
    libzip-dev \
    freetype \
    libjpeg-turbo \
    libpng \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    sqlite-dev \
    # Node.js and Yarn installation
    nodejs \
    yarn \
    # Build dependencies
    && docker-php-ext-configure zip \
    && docker-php-ext-install zip pdo pdo_mysql \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd \
    && docker-php-ext-enable gd \
    # Clean up
    && rm -rf /var/cache/apk/*

# Install composer
COPY --from=composer:2.7.6 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application files
COPY . .

# Set permissions and install dependencies
RUN mkdir -p storage bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache \
    && composer install --no-dev --prefer-dist --optimize-autoloader \
    && ([ -f package.json ] && yarn install --frozen-lockfile || echo "Skipping Yarn (no package.json)") \
    && ([ -f package.json ] && yarn build || echo "Skipping Yarn build") \
    && chown -R www-data:www-data vendor \
    && rm -rf /tmp/* /root/.npm /root/.yarn*

# stage 2: production stage
FROM php:8.3-fpm-alpine

# Install production dependencies
RUN apk add --no-cache --update --virtual .build-deps \
        libpng-dev \
        freetype-dev \
        libjpeg-turbo-dev \
        zlib-dev \
        libzip-dev \
        oniguruma-dev \
        gettext-dev \
        pkgconfig \
    && apk add --no-cache \
        nginx \
        supervisor \
        libpng \
        freetype \
        libjpeg-turbo \
        libzip \
    # Install extensions
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        zip pdo pdo_mysql gd bcmath exif gettext opcache \
    && docker-php-ext-enable opcache \
    # Clean up
    && apk del .build-deps \
    && rm -rf /var/cache/apk/* /tmp/*

# Copy from build stage
COPY --from=build /var/www/html /var/www/html

# Copy config files
COPY ./deploy/nginx.conf /etc/nginx/http.d/default.conf
COPY ./deploy/php.ini "$PHP_INI_DIR/conf.d/app.ini"
COPY ./deploy/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

WORKDIR /var/www/html

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

VOLUME ["/var/www/html/storage"]

# Use supervisor to manage processes
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]