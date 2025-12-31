<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        \Illuminate\Mail\Events\MessageSending::class => [
            \App\Listeners\LogMailEvents::class,
        ],
        \Illuminate\Mail\Events\MessageSent::class => [
            \App\Listeners\LogMailEvents::class,
        ],
    ];

    public function boot(): void {}
}
