<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class PageLinkSettings extends Settings
{
    public string $page_support = 'https://www.korpheal.com/contact-us/';
    //public string $page_terms_conditions = 'https://www.korpheal.com/terms-conditions';
    public string $page_disclaimer = 'https://www.korpheal.com/legal/disclaimer/';
    public string $page_legal = 'https://www.korpheal.com/legal';
    public string $page_privacy_policy = 'https://www.korpheal.com/legal/privacy-policy';
    public string $page_unsubscribe = 'https://www.korpheal.com/unsubscribe';
    public string $page_terms_of_use = 'https://www.korpheal.com/legal/terms-of-use/';
    public string $page_return_policy = 'https://www.korpheal.com/legal/refund-cancellation-policy/';
   //public string $page_shipping_policy = '/shipping-policy';
    public static function group(): string
    {
        return 'page_link';
    }
}
