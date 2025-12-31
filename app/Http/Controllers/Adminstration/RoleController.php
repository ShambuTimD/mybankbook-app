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
        try {
            $data =  Role::create($request->except('_token'));

            for ($i = 0; $i < count($request->permission); $i++) {
                Permission::create([
                    'role_id' => $data->id,
                    'name' => $request->permission[$i],
                    'created_by' => $request->user()->id
                ]);
            }
            return Inertia::location(route('role.list'));
        } catch (Exception $e) {
            Role::delete($data->id);
            return response()->json(['error' => $e->getMessage()]);
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
            'data' => $role->only(['id', 'name', 'role_for']) + [
                'current_permissions' => $role->permissions->pluck('name'),
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RoleUpdateRequst $request, Role $role)
    {


        try {
            $role->update($request->except(['_token', '_method', 'permission']));
            Permission::where('role_id', $role->id)->delete();
            for ($i = 0; $i < count($request->permission); $i++) {
                Permission::create([
                    'role_id' => $role->id,
                    'name' => $request->permission[$i],
                    'created_by' => $request->user()->id
                ]);
            }
            return redirect()->route('role.list')->with('success', 'Role updated successfully.');
        } catch (Exception $e) {
            return redirect()->back()->with('error', 'Failed to update role: ' . $e->getMessage());
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
