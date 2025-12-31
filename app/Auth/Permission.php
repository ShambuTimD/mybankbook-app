<?php

namespace App\Auth;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

class Permission
{

    public static function check($permission_route_name)
    {
        $autherized = false;
        // here i have checked the user admin or not
        if (auth()->user()->type === "admin") {
            $authorized = true;
            return $authorized;
        }
        $data =   DB::table('permissions')->where('role_id', auth()->user()->role_id)->whereIn('name', $permission_route_name)->first();
        if (!empty($data)) {
            $autherized = true;
        }


        return $autherized;
    }

    public static function getAllowedRoute()
    {

        $route_name = 'dashboard.show';
        // foreach (auth()->user()->role as $role) {
        //     $data =   DB::table('permissions')->where("role_id", $role->id)->where('route_name', 'like', "%index%")->where('route_name', 'NOT LIKE', "%-%")->first();
        //     if (!empty($data)) {
        //         $route_name = $data->route_name;
        //         break;
        //     }
        // }
        return $route_name;
    }



    public static function renamePermission(string $now_permission, array $permissions)
    {
        return $permissions[$now_permission] ?? $now_permission;
    }

    public static function getRoutePermission()
    {
        $all_routes = array();
        $routes = Route::getRoutes();
        foreach ($routes as $route) {
            $route_name = explode(".", $route->getName());
            if (!in_array($route_name[0], $all_routes, true)) {
                array_push($all_routes, $route_name[0]);
            }
            ($route_name[0]) ? $array_route[$route_name[0]][] = $route->getName() : '';
        }
        unset(
            $array_route['logout'],
            $array_route['login'],
            $array_route['password'],
            $array_route['verification'],
            $array_route['register'],
            $array_route['sanctum'],
            $array_route['ignition'],
            $array_route['request-docs'],
            $array_route['notfound'],
            $array_route['storage'],
            $array_route['unisharp'],
            $array_route['livewire'],
            $array_route['pulse'],
        );

        return $array_route;
    }
}
