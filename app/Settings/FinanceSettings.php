<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class FinanceSettings extends Settings
{
     public string $payment_gateway_provider = 'Razorpay';
    public string $payment_gateway_api_key = 'rzp_test_key';
    public string $payment_gateway_secret = 'rzp_test_secret';

    public static function group(): string
    {
        return 'finance';
    }
}