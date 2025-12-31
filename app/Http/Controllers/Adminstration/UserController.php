<?php

namespace App\Http\Controllers\Adminstration;

use App\Http\Controllers\Controller;
use App\Http\Requests\Adminstration\UserStoreRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Yajra\DataTables\DataTables;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use App\Notifications\UserCreatedNotification;
use App\Models\Role;
use App\Models\Customers;
use Illuminate\Support\Facades\Auth;
class UserController extends Controller
{

    public $tilte = 'User';
    public function index(Request $request)
    {

        if ($request->wantsJson()) {
            return DataTables::of(User::query())
                ->addIndexColumn()
                ->editColumn('created_at', fn($user) => $user->created_at->format('Y-m-d'))
                ->addColumn('action', function ($user) {
                    return 'edit';
                })
                ->make(true);
        }
        return Inertia::render('Adminstration/User/Index', [
            'title' => $this->tilte,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $roles = Role::where('is_active', 1)->get()->groupBy('role_for');
        $customerRoleId = Role::where('name', 'Customer')->value('id');


        return Inertia::render('Adminstration/User/Create', [
            'rolesGrouped' => $roles,
            'customerRoleId' => $customerRoleId,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    // public function store(UserStoreRequest $request)
    // {
    //     $user = User::create([
    //         'name' => $request->name,
    //         'email' => $request->email,
    //         'password' => bcrypt($request->password),
    //     ]);
    //     Notification::send($user, new UserCreatedNotification());
    //     return redirect()->route('user.list')->with('success', 'User created successfully.');
    // }
    // public function store(Request $request)
    //     {
    //         $request->validate([
    //             'name' => 'required|string|max:255',
    //             'email' => 'required|email|unique:users,email',
    //             'password' => 'required|confirmed|min:6',
    //             'type' => 'required|in:backend,frontend,others',
    //             'role_id' => 'required|exists:roles,id',
    //         ]);

    //         $user = User::create([
    //             'name' => $request->name,
    //             'email' => $request->email,
    //             'password' => bcrypt($request->password),
    //             'type' => $request->type,
    //         ]);

    //         // optional: attach to user_roles table
    //         $user->roles()->attach($request->role_id); // if using many-to-many

    //         return redirect()->route('user.list')->with('success', 'User created successfully.');
    //     }
 

// public function store(Request $request)
// {
//     $customerRoleId = Role::where('name', 'Customer')->value('id');

//     // Base validation rules
//     $rules = [
//         'name' => 'required|string|max:255',
//         'password' => 'required|string|confirmed|min:6',
//         'type' => 'required|in:frontend,backend,others',
//         'role_id' => 'required|exists:roles,id',
//     ];

//     // Add conditional validation based on role
//     if ((int) $request->role_id === (int) $customerRoleId) {
//         // Customer: unique phone & email_id (on customers table)
//         $rules['phone'] = 'required|string|unique:customers,phone_number';
//     } else {
//         // User: unique email (on users table)
//         $rules['email'] = 'required|email|unique:users,email';
//     }

//     $validated = $request->validate($rules);

//     if ((int) $request->role_id === (int) $customerRoleId) {
//         // Insert into `customers` table
//         Customers::create([
//             'first_name' => $request->name,
//             'last_name' => '',
//             'email_id' => $request->email,
//             'phone_number' => $request->phone,
//             'password' => Hash::make($request->password),
//             'gender' => null,
//             'dob' => null,
//             'created_by' => Auth::id(),
//         ]);
//     } else {
//         // Insert into `users` table
//         $user = User::create([
//             'name' => $request->name,
//             'email' => $request->email,
//             'password' => Hash::make($request->password),
//             'type' => $request->type,
//         ]);

//         $user->roles()->attach($request->role_id);
//     }
//       Notification::send($user, new UserCreatedNotification());
//     return redirect()->route('user.list')->with('success', 'User created successfully.');
// }
//     public function store(Request $request)
// {
//     $customerRoleId = Role::where('name', 'Customer')->value('id');

//     // Base validation rules
//     $rules = [
//         'name' => 'required|string|max:255',
//         'password' => 'required|string|confirmed|min:6',
//         'type' => 'required|in:frontend,backend,others',
//         'role_id' => 'required|exists:roles,id',
//     ];

//     // Add conditional validation based on role
//     if ((int) $request->role_id === (int) $customerRoleId) {
//         // Customer: unique phone & email_id (on customers table)
//         $rules['phone'] = 'required|string|unique:customers,phone_number';
//     } else {
//         // User: unique email (on users table)
//         $rules['email'] = 'required|email|unique:users,email';
//     }

//     $validated = $request->validate($rules);

//     if ((int) $request->role_id === (int) $customerRoleId) {
//         // Insert into `customers` table
//         Customers::create([
//             'first_name' => $request->name,
//             'last_name' => '',
//             'email_id' => $request->email,
//             'phone_number' => $request->phone,
//             'password' => Hash::make($request->password),
//             'gender' => null,
//             'dob' => null,
//             'created_by' => Auth::id(),
//         ]);
//     } else {
//         // Insert into `users` table
//         $user = User::create([
//             'name' => $request->name,
//             'email' => $request->email,
//             'password' => Hash::make($request->password),
//             'type' => $request->type,
//         ]);

//         $user->roles()->attach($request->role_id);

//         // ✅ Send Laravel mail notification
//         Notification::send($user, new UserCreatedNotification());

//         // ✅ Save to custom notifications table
//         $notificationData = (new UserCreatedNotification())->toArray($user);

//         \App\Models\Notification::create(array_merge($notificationData, [
//             'user_id' => $user->id,
//             'is_read' => 'unread',
//             'created_by' => Auth::id(),
//         ]));
//     }

//     return redirect()->route('user.list')->with('success', 'User created successfully.');
// }

    public function store(Request $request)
{
    $rules = [
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|confirmed|min:6',
        'role_id' => 'required|exists:roles,id',
    ];

    $validated = $request->validate($rules);

    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'type' => 'backend', // force backend type
    ]);

    $user->roles()->attach($request->role_id);

    // Send notification (optional)
    Notification::send($user, new UserCreatedNotification());

    \App\Models\Notification::create(array_merge(
        (new UserCreatedNotification())->toArray($user),
        [
            'user_id' => $user->id,
            'is_read' => 'unread',
            'created_by' => Auth::id(),
        ]
    ));

    return redirect()->route('user.list')->with('success', 'User created successfully.');
}

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        //  dd($user);
        return Inertia::render('Adminstration/User/Edit', [
            'title' => $this->tilte,
            'user' => $user,
             
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
//    public function update(Request $request, User $user)
//     {
//         $validated = $request->validate([
//             'name' => ['required', 'string', 'max:255'],
//             'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
//             'password' => ['nullable', 'string', 'min:6', 'confirmed'],
      
//         ]);

//         $user->name = $validated['name'];
//         $user->email = $validated['email'];
       

//         if (!empty($validated['password'])) {
//             $user->password = Hash::make($validated['password']);
//         }

//         $user->save();

//         return redirect()->route('user.list')->with('success', 'User updated successfully.');
//     }

    public function update(Request $request, User $user)
{
    $validated = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
        'password' => ['nullable', 'string', 'min:6', 'confirmed'],
        'role_id' => ['required', 'exists:roles,id'],
        'type' => ['required', 'in:backend,store,warehouse'], // if you support more types
    ]);

    $user->name = $validated['name'];
    $user->email = $validated['email'];
    $user->role_id = $validated['role_id'];
    $user->type = $validated['type']; // fixed 'backend' comes from form

    if (!empty($validated['password'])) {
        $user->password = Hash::make($validated['password']);
    }

    $user->save();

    return redirect()->route('user.list')->with('success', 'User updated successfully.');
}

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        try {
            $user->delete();
            return redirect()->route('user.list')->with('toast', [
                'type' => 'success',
                'message' => 'User deleted successfully!',
            ]);
        } catch (\Exception $e) {
            return redirect()->route('user.list')->with('toast', [
                'type' => 'error',
                'message' => 'Failed to delete user: ' . $e->getMessage(),
            ]);
        }
    }
}
