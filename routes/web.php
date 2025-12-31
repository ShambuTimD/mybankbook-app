<?php

use App\Http\Controllers\Adminstration\RoleController;
use App\Http\Controllers\Adminstration\UserController;
use App\Http\Controllers\CustomersController;
use App\Http\Controllers\Adminstration\AdminController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\CompanyOfficeController;
use App\Http\Controllers\CompanyUserController;
use App\Http\Controllers\BookingAdminController;
use Inertia\Inertia;

require __DIR__ . '/auth.php';


// Route::middleware(['auth', 'verified'])->group(function () {
Route::get('/test', function () {
    return Inertia::render('Test/test');
});

Route::get('/brand-self-appointment', function () {
    return Inertia::render('BrandSelfAppointment/Index');
});

// Thank You Page Route
Route::get('/thank-you', function () {
    return Inertia::render('BrandSelfAppointment/ThankYouPage');
})->name('thankyou.page');

//  Failed Page Route
Route::get('/failed', function () {
    return Inertia::render('BrandSelfAppointment/FailedPage');
})->name('failed.page');

Route::get('/submitted-data', function () {
    return Inertia::render('BrandSelfAppointment/SubmittedDataView');
});

Route::get('/submitted-data-failed', function () {
    return Inertia::render('BrandSelfAppointment/SubmittedDataViewFailed');
})->name('submitteddata.failed');

// --- Dashboard Routes ---
Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('dashboard');

// Dashboard Layout Pages
Route::middleware(['auth', 'verified', 'throttle:60,1'])->group(function () {
    Route::get('/', fn() => Inertia::render('Dashboard/Home'))->name('dashboard');

    // Other Pages
    // Route::get('/profile', fn() => Inertia::render('UserProfiles'));
    Route::get('/calendar', fn() => Inertia::render('Calendar'));
    Route::get('/blank', fn() => Inertia::render('Blank'));

    // Forms
    Route::get('/form-elements', fn() => Inertia::render('Forms/FormElements'));

    // Tables
    Route::get('/basic-tables', fn() => Inertia::render('Tables/BasicTables'));

    // UI Elements
    Route::get('/alerts', fn() => Inertia::render('UiElements/Alerts'));
    Route::get('/avatars', fn() => Inertia::render('UiElements/Avatars'));
    Route::get('/badge', fn() => Inertia::render('UiElements/Badges'));
    Route::get('/buttons', fn() => Inertia::render('UiElements/Buttons'));
    Route::get('/images', fn() => Inertia::render('UiElements/Images'));
    Route::get('/videos', fn() => Inertia::render('UiElements/Videos'));

    // Charts
    Route::get('/line-chart', fn() => Inertia::render('Charts/LineChart'));
    Route::get('/bar-chart', fn() => Inertia::render('Charts/BarChart'));

    // Auth Pages (Public)
    Route::get('/signin', fn() => Inertia::render('AuthPages/SignIn'));
    Route::get('/signup', fn() => Inertia::render('AuthPages/SignUp'));

    // Catch-all (fallback) route — optional
    Route::fallback(fn() => Inertia::render('OtherPage/NotFound'))->name('notfound');
    Route::prefix('adminstration')->group(function () {
        Route::controller(UserController::class)->as('user.')->prefix('users')->group(function () {
            Route::get('/', 'index')->name('list');
            Route::get('/create', 'create')->name('create');
            Route::post('/store', 'store')->name('store');
            Route::get('/{user}/edit', 'edit')->name('edit');
            Route::put('/{user}', 'update')->name('update');
            Route::delete('/{user}', 'destroy')->name('delete');
        });

        Route::controller(RoleController::class)->as('role.')->prefix('roles')->group(function () {
            Route::get('/', 'index')->name('list');
            Route::get('/create', 'create')->name('create');
            Route::post('/store', 'store')->name('store');
            Route::get('/{role}/edit', 'edit')->name('edit');
            Route::put('/{role}', 'update')->name('update');
            Route::delete('/{role}', 'destroy')->name('delete');
        });
    });
    Route::controller(CustomersController::class)->as('customer.')->prefix('customers')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/list', 'list')->name('list');
        Route::get('/create', 'create')->name('create');
        Route::post('/store', 'store')->name('store');
        Route::get('/{customer}/edit', 'edit')->name('edit');
        Route::put('/{customer}', 'update')->name('update');
        Route::delete('/{customer}', 'destroy')->name('delete');
    });
    //Profile Module
    Route::controller(AdminController::class)->as('admin.profile.')->prefix('profile')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/edit/{id}', 'edit')->name('edit');
        Route::post('/update/{id}', 'update')->name('update');
    });
    // Notification Module
    Route::controller(NotificationController::class)->as('notification.')->prefix('notifications')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/fetch', 'fetch')->name('fetch');
    });
    // Company Module
    Route::controller(CompanyController::class)->as('companies.')->prefix('companies')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/list', 'list')->name('list');
        Route::get('/create', 'create')->name('create');
        Route::post('/store', 'store')->name('store');
        Route::get('/{company}/edit', 'edit')->name('edit');
        Route::put('/{company}', 'update')->name('update');
        Route::patch('/{company}/toggle-status', 'toggleStatus')->name('toggle-status');
    });
    // Company Office Module
    Route::controller(CompanyOfficeController::class)->as('companyOffice.')->prefix('company-offices')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/list', 'list')->name('list');
        Route::get('/create', 'create')->name('create');
        Route::post('/store', 'store')->name('store');
        Route::get('/{companyOffice}/edit', 'edit')->name('edit');
        Route::put('/{companyOffice}', 'update')->name('update');
        Route::patch('/{companyOffice}/toggle-status', 'toggleStatus')->name('toggle-status');

    });
    // Company User Module
    Route::controller(CompanyUserController::class)->as('companyUser.')->prefix('company-users')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/list', 'list')->name('list');
        Route::get('/create', 'create')->name('create');
        Route::post('/store', 'store')->name('store');
        Route::get('/{companyUser}/edit', 'edit')->name('edit');
        Route::put('/{companyUser}', 'update')->name('update');
        Route::patch('/{companyUser}/toggle-status', 'toggleStatus')->name('toggle-status');

    });
    //booking module
    Route::controller(BookingAdminController::class)->as('booking.')->prefix('bookings')->group(function () {
        Route::get('/', 'index')->name('index');       
        Route::get('/list', 'list')->name('list');     
        Route::get('/{id}', 'show')->name('show');      
        Route::get('/{id}/edit', 'edit')->name('edit');
        Route::patch('/{id}/status', 'updateStatus')->name('status');
        Route::delete('/{id}', 'destroy')->name('destroy');
    });
});
