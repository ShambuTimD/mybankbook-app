<?php

namespace App\Http\Controllers\Adminstration;

use App\Auth\Permission as AuthPermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Adminstration\RoleRequest;
use App\Http\Requests\Adminstration\RoleUpdateRequst;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Yajra\DataTables\DataTables;
use App\Models\Permission;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;


class RoleController extends Controller
{

    public $title = 'Role';
    public function index(Request $request)
    {
        if ($request->wantsJson()) {
            return DataTables::of(Role::query())
                ->addIndexColumn()
                ->editColumn('created_at', fn($role) => $role->created_at->format('Y-m-d'))
                ->addColumn('action', function ($role) {})
                ->make(true);
        }
        return Inertia::render('Adminstration/Role/Index', [
            'title' => 'Role',
        ]);
    }



    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Adminstration/Role/Create', [
            'title' => $this->title,
            'permissions' => AuthPermission::getRoutePermission(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RoleRequest $request)
    {
        DB::beginTransaction();

        try {
            // Find existing role
            $role = Role::where('role_for', $request->role_for)
                ->where('role_name', $request->role_name)
                ->firstOrFail();

            // Remove existing permissions
            Permission::where('role_id', $role->id)->delete();

            // Insert new permissions
            foreach ($request->permission as $perm) {
                Permission::create([
                    'role_id'    => $role->id,
                    'name'       => $perm,
                    'created_by' => $request->user()->id,
                ]);
            }

            DB::commit();
            return Inertia::location(route('role.list'));
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }



    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Role $role)
    {
        return Inertia::render('Adminstration/Role/EditRole', [
            'page' => $this->title,
            'permissions' => AuthPermission::getRoutePermission(),
            'data' => $role->only(['id', 'role_name', 'role_title', 'role_for']) + [
                'current_permissions' => $role->permissions->pluck('name'),
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RoleUpdateRequst $request, Role $role)
    {
        DB::beginTransaction();

        try {
            // Collect requested permissions
            $newPerms = collect($request->permission);

            // Get existing permissions in DB
            $oldPerms = $role->permissions()->pluck('name');

            // Find which to add
            $toAdd = $newPerms->diff($oldPerms);

            // Find which to remove
            $toRemove = $oldPerms->diff($newPerms);

            // Remove unchecked permissions
            if ($toRemove->isNotEmpty()) {
                Permission::where('role_id', $role->id)
                    ->whereIn('name', $toRemove)
                    ->delete();
            }

            // Add new permissions
            foreach ($toAdd as $perm) {
                Permission::create([
                    'role_id'    => $role->id,
                    'name'       => $perm,
                    'created_by' => $request->user()->id,
                ]);
            }

            DB::commit();

            return redirect()
                ->route('role.list')
                ->with('success', 'Permissions updated successfully for role: ' . $role->role_title);
        } catch (Exception $e) {
            DB::rollBack();
            return redirect()
                ->back()
                ->with('error', 'Failed to update permissions: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $role = Role::findOrFail($id);
        try {
            $role->delete();
            Permission::where('role_id', $role->id)->delete();
            return redirect()->back()->with('toast', [
                'type' => 'success',
                'message' => 'User created successfully!',
            ]);
        } catch (Exception $e) {
            return redirect()->back()->with(['toast' => [
                'type' => 'error',
                'message' => 'Failed to delete role: ' . $e->getMessage(),
            ]]);
        }
    }
}
