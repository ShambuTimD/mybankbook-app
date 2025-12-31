<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PermissionCheck
{
    public function handle(Request $request, Closure $next, $permission)
    {
        $user = $request->user();

        if (!$user) {
            abort(403, 'Unauthorized');
        }

        // ✅ If user has role "super_admin", skip permission check
        if ($user->roles()->where('role_name', 'super_admin')->exists()) {
            return $next($request);
        }

        // Use new allPermissions helper
        $permissions = $user->allPermissions();

        // dd($user, $permissions);

        if (!$permissions->contains($permission)) {
            abort(403, 'Unauthorized');
        }

        return $next($request);
    }
}
