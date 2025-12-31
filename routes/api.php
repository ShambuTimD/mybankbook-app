<?php

use App\Http\Controllers\Api\TestMasterController;
use App\Http\Controllers\BookingAdminController;
use App\Http\Controllers\Frontend\BookingController;
use App\Http\Controllers\Frontend\LoginController;
use App\Http\Controllers\Frontend\CompanyUserAuthController;
use App\Http\Controllers\Frontend\DashboardController;
use App\Http\Controllers\Frontend\FrontendController;
use App\Http\Controllers\Frontend\Support\ChatController;
use App\Http\Controllers\Frontend\Support\TicketController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\SupportChat;

/**
 * ------------------------------
 * PUBLIC (NO AUTH REQUIRED)
 * ------------------------------
 */
Route::post('customer/login', [LoginController::class, 'customerlogin'])
    ->middleware('throttle:customer-login');

Route::post('company-user/login', [CompanyUserAuthController::class, 'login'])
    ->name('company-user.login');

Route::get('bookings/{id}', [BookingController::class, 'show'])->name('frontbooking.show');
Route::get('/booking/public/summary', [BookingController::class, 'publicSummary'])->name('frontbooking.public.summary');
Route::post('/booking/public/summary', [BookingController::class, 'publicBrnSummary'])->name('frontbooking.public.brn.summary');
Route::get('/bookings/export/{id}', [BookingAdminController::class, 'export'])->name('frontbooking.export');
Route::get('/frontend/settings', [FrontendController::class, 'settings'])->name('frontend.settings');

Route::get('/test-masters', [TestMasterController::class, 'index'])->name('test_master');

/**
 * ------------------------------
 * PROTECTED ROUTES (AUTH REQUIRED)
 * ------------------------------
 */
Route::middleware('auth:sanctum')->group(function () {

    Route::post('customer/logout', [LoginController::class, 'logout']);

    Route::controller(CompanyUserAuthController::class)
        ->as('company.')
        ->prefix('company-user')
        ->group(function () {
            Route::get('/logout', 'logout')->name('logout');
            Route::get('/profile', 'details')->name('details');
            Route::put('/profile', 'updateProfile')->name('updateProfile'); // ✅ Added for edit
        });

    Route::controller(BookingController::class)->as('frontbooking.')->prefix('bookings')->group(function () {
        Route::get('/metrics', 'dashboardmetrics')->name('metrics');
        Route::get('/', 'index')->name('index');
        Route::post('/store', 'store')->name('store');
        Route::patch('/{id}/status', 'updateStatus')->name('updateStatus');
        Route::get('/{id}', 'show')->where('id', '[0-9]+')->name('show');
        Route::get('/{id}/applicants', 'bookingApplicants')->name('applicants');
    });

    Route::controller(BookingController::class)->as('applicants.')->prefix('applicants')->group(function () {
        Route::get('/list', 'applicantList')->name('index');
    });

    // Reports
    Route::controller(BookingController::class)->as('report.')->prefix('reports')->group(function () {
        Route::get('/list', 'reportList')->name('list');
    });

    // Support Ticket
    Route::prefix('/support')->as('frontend.support.')->group(function () {

        Route::controller(TicketController::class)->prefix('tickets')->as('tickets.')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/list', 'list')->name('list');
            Route::get('/create', 'create')->name('create');
            Route::post('/store', 'store')->name('store');
            Route::get('/view/{id}', 'show')->name('view');
            Route::delete('/{id}', 'destroy')->name('destroy');
            // ⭐ USER ZIP DOWNLOAD ROUTE
            Route::get('/download-zip/{chat}', 'downloadZip')
                ->whereNumber('chat')
                ->name('downloadZip');
        });

        // Chat Section
        Route::controller(ChatController::class)->prefix('chat')->as('chat.')->group(function () {
            Route::get('/messages/{ticket_id}', 'fetch')->name('messages');
            Route::post('/send', 'send')->name('send');
        });
    });


    // Frontend User Dashboard
    Route::controller(DashboardController::class)->as('dashboard.')->prefix('dashboard')->group(function () {
        Route::get('/metrics', 'dashboardmetrics')->name('metrics');
        Route::get('/settings', 'getGroupedSettings')->name('settings');
    });

    // Notifications
    Route::controller(FrontendController::class)->as('notification.')->prefix('notifications')->group(function () {
        Route::get('/list', 'notification')->name('list');
        Route::post('/{id}', 'notificationUpdate')->name('update');
        Route::delete('/delete-all', 'notificationDeleteAll')->name('deleteAll');
        Route::delete('/{id}', 'notificationDelete')->name('delete');
    });

    // FAQs
    Route::get('faqs', [\App\Http\Controllers\Frontend\FAQController::class, 'index'])->name('faq.index');

    // Financial Years
    Route::get('/financial-years', [\App\Http\Controllers\Frontend\FinanceController::class, 'financialYears'])->name('financial.years');
});
