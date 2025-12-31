<?php

use App\Http\Controllers\Frontend\BookingController;
use App\Http\Controllers\Frontend\LoginController;
use App\Http\Controllers\Frontend\CompanyUserAuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/**
 * ------------------------------
 * PUBLIC (NO AUTH REQUIRED)
 * ------------------------------
 */

// Customer Login (throttled)
Route::post('customer/login', [LoginController::class, 'customerlogin'])->middleware('throttle:customer-login');

// Company User Login
Route::post('company-user/login', [CompanyUserAuthController::class, 'login'])->name('company-user.login');

// Booking Details
Route::get('bookings/{id}', [BookingController::class, 'show'])->name('booking.show');

// OPTIONAL: Public ping or config routes can go here.


/**
 * ------------------------------
 * PROTECTED ROUTES (AUTH REQUIRED)
 * ------------------------------
 */
Route::middleware('auth:sanctum')->group(function () {

    // Logout
    Route::post('customer/logout', [LoginController::class, 'logout']);

    Route::post('company-user/logout', [CompanyUserAuthController::class, 'logout']);

    // Booking Submission
    Route::controller(BookingController::class)->as('booking.')->prefix('bookings')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/store', 'store')->name('store');
        Route::get('/{id}', 'show')->name('show');
        Route::patch('/{id}/status', 'updateStatus')->name('updateStatus');
    });
});
