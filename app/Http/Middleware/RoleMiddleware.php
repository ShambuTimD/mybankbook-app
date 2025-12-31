<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    public function handle($request, Closure $next, ...$roles)
    {
        // Ensure the user is authenticated
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        // dd($user); // Debugging line to check roles

        // Ensure user has a roles relationship loaded
        if (!$user->roles) {
            abort(403, 'No role assigned.');
        }

        // Get the roles for checking
        $roleNames = $user->roles->pluck('role_name')->toArray();  // assuming the roles relation is properly loaded

        // Match by role_name and check if the user is allowed
        if (!array_intersect($roles, $roleNames)) {
            abort(403, 'Unauthorized access.');
        }

        // Check for 'role_for' being 'backend'
        if ($user->roles->first()->role_for !== 'backend') {
            abort(403, 'Frontend users cannot access backend.');
        }

        return $next($request);
    }
}
