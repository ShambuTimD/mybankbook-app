<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\View;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        Inertia::share([
            'auth' => fn() => [
                'user' => Auth::user(),
            ],
            'settings'=>[
                'app_settings'=>app(\App\Settings\AppSettings::class)
            ],
            'communication'=>[
                'communication_settings'=>app(\App\Settings\CommunicationSettings::class)
            ],
             'emailfooter'=>[
                'pagelink_settings'=>app(\App\Settings\PageLinkSettings::class)
            ]
        ]);
        View::composer("*",function($view){
            $view->with('app_settins',app(\App\Settings\AppSettings::class));
            

        });

        // Gate::define('viewPulse', function (User $user) {
        //     return $user->isAdmin(); // 👈 your condition
        // });
    }
}
