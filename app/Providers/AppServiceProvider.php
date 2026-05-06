<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        if ($this->app->environment('production')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        // Point password reset emails to the React SPA route
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            return url('/reset-password') . '?token=' . $token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}

