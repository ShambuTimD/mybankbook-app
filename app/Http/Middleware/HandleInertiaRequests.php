<?php

namespace App\Http\Middleware;

use App\Settings\AppSettings;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'roles' => fn() => $request->user()
                    ? $request->user()->roles()->get(['role_name', 'role_title'])
                    : [],
                'permissions' => fn() => $request->user()
                    ? $request->user()->allPermissions()->toArray()
                    : [],
            ],
            'settings' => [
                'app_settings' => fn() => app(AppSettings::class),
            ],
        ];
    }
}
