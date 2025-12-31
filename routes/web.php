<?php

use App\Http\Controllers\Administration\AppSettingsController;
use App\Http\Controllers\Adminstration\AdminController;
use App\Http\Controllers\Adminstration\RoleController;
use App\Http\Controllers\Adminstration\UserController;
use App\Http\Controllers\BookingAdminController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\CompanyOfficeController;
use App\Http\Controllers\CompanyUserController;
use App\Http\Controllers\CustomersController;
use App\Http\Controllers\FaqCategoryController;
use App\Http\Controllers\FAQController;
use App\Http\Controllers\Frontend\BookingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\SupportChatController;
use App\Http\Controllers\SupportTicketController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

require __DIR__ . '/auth.php';

Route::get('/', function () {
    return redirect()->route('login');
});

Route::prefix('/f')->group(function () {
    Route::get('/maintenance', fn() => Inertia::render('BrandSelfAppointment/MaintenancePage'))
        ->name('maintenance');

    Route::get('/self-booking', fn() => Inertia::render('BrandSelfAppointment/Index'))
        ->name('brandselfappointment.index');

    Route::get('/bookings/export/{id}', [BookingAdminController::class, 'export'])
        ->name('booking.export');
    Route::get('/bookings/report/{id}', [BookingAdminController::class, 'exportReport'])
        ->name('booking.report');

    Route::get('/self-booking/thank-you', fn() => Inertia::render('BrandSelfAppointment/ThankYouPage'))
        ->name('thankyou.page');

    Route::get('/failed', fn() => Inertia::render('BrandSelfAppointment/FailedPage'))
        ->name('failed.page');

    Route::get('/submitted-data-failed', fn() => Inertia::render('BrandSelfAppointment/SubmittedDataViewFailed'))
        ->name('submitteddata.failed');

    Route::get('/dashboard', fn() => Inertia::render('BrandSelfAppointment/Index'))
        ->name('frontend.dashboard');

    Route::get('/bookings', fn() => Inertia::render('BrandSelfAppointment/Index'))
        ->name('frontend.bookings');

    Route::get('/bills', fn() => Inertia::render('BrandSelfAppointment/Index'))
        ->name('frontend.bills');

    Route::get('/reports', fn() => Inertia::render('BrandSelfAppointment/Index'))
        ->name('frontend.reports');

    Route::get('/notifications', fn() => Inertia::render('BrandSelfAppointment/Index'))
        ->name('frontend.notifications');

    Route::get('/support', fn() => Inertia::render('BrandSelfAppointment/Index'))
        ->name('frontend.support');

    Route::get('/support/faq', fn() => Inertia::render('BrandSelfAppointment/FaqPage'))
        ->name('frontend.support.faq');

    Route::get('/support/history', fn() => Inertia::render('BrandSelfAppointment/SupportPages/SupportTicketHistory'))
        ->name('frontend.support.history');

    Route::get('/support/raise-ticket/new', fn() => Inertia::render('BrandSelfAppointment/SupportPages/CreateTicketPage'))
        ->name('frontend.support.create');

    Route::get('/profile', fn() => Inertia::render('BrandSelfAppointment/Index'))
        ->name('frontend.profile');

    Route::get('/faqs', fn() => Inertia::render('BrandSelfAppointment/FaqPage'))
        ->name('frontend.faqs');

    Route::get('/support/viewdetails/{id}', function ($id) {
        return Inertia::render('BrandSelfAppointment/FrontendUserDashboard/SupportPages/TicketDetailsPage', [
            'ticket_id' => $id,
        ]);
    })->name('frontend.support.ticket.viewdetails');
    Route::get('/bookings/{id}/applicants', function ($id) {
        // ✅ Wrap in try-catch to prevent 500 error if settings table is empty or class missing
        try {
            $settings = \App\Settings\AppSettings::first();
        } catch (\Throwable $e) {
            $settings = null;
        }

        return Inertia::render('BrandSelfAppointment/FrontendUserDashboard/ApplicantsPage', [
            'booking_id' => $id,
            'settings' => $settings,
        ]);
    })->name('frontend.applicants');
    Route::get('/support/{id}/view', function ($id) {
        // 1. Change 'messages.sender' to 'chats.sender'
        $ticket = \App\Models\SupportTicket::with(['chats.sender', 'office'])->findOrFail($id);

        return Inertia::render('BrandSelfAppointment/SupportPages/UserConversation', [
            'selectedTicket' => $ticket,
            // 2. Change '$ticket->messages' to '$ticket->chats'
            'ticketMessages' => $ticket->chats,
        ]);
    })->name('frontend.conversation.view');
});

// DOWNLOAD REPORT / BILL WITH TIMESTAMP
Route::get('/booking/detail/{id}/download/{type}', [BookingController::class, 'downloadMedia'])->name('booking.detail.download');


// ---------- Authenticated ----------
Route::middleware(['auth', 'verified', 'throttle:60,1'])->group(function () {
    Route::prefix('/a')->group(function () {
        Route::get('/dashboard', fn() => Inertia::render('Dashboard/Home'))
            ->name('dashboard.view')->middleware('permission:dashboard.view');

        // Misc pages
        Route::get('/calendar', fn() => Inertia::render('Calendar'))
            ->name('calendar.view')->middleware('permission:calendar.view');

        Route::get('/blank', fn() => Inertia::render('Blank'))
            ->name('blank.view')->middleware('permission:blank.view');

        Route::get('/form-elements', fn() => Inertia::render('Forms/FormElements'))
            ->name('forms.elements')->middleware('permission:forms.elements');

        Route::get('/basic-tables', fn() => Inertia::render('Tables/BasicTables'))
            ->name('tables.basic')->middleware('permission:tables.basic');

        Route::get('/alerts', fn() => Inertia::render('UiElements/Alerts'))
            ->name('ui.alerts')->middleware('permission:ui.alerts');

        Route::get('/avatars', fn() => Inertia::render('UiElements/Avatars'))
            ->name('ui.avatars')->middleware('permission:ui.avatars');

        Route::get('/badge', fn() => Inertia::render('UiElements/Badges'))
            ->name('ui.badges')->middleware('permission:ui.badges');

        Route::get('/buttons', fn() => Inertia::render('UiElements/Buttons'))
            ->name('ui.buttons')->middleware('permission:ui.buttons');

        Route::get('/images', fn() => Inertia::render('UiElements/Images'))
            ->name('ui.images')->middleware('permission:ui.images');

        Route::get('/videos', fn() => Inertia::render('UiElements/Videos'))
            ->name('ui.videos')->middleware('permission:ui.videos');

        Route::get('/line-chart', fn() => Inertia::render('Charts/LineChart'))
            ->name('charts.line')->middleware('permission:charts.line');

        Route::get('/bar-chart', fn() => Inertia::render('Charts/BarChart'))
            ->name('charts.bar')->middleware('permission:charts.bar');

        Route::get('/signin', fn() => Inertia::render('AuthPages/SignIn'))
            ->name('auth.signin')->middleware('permission:auth.signin');

        Route::get('/signup', fn() => Inertia::render('AuthPages/SignUp'))
            ->name('auth.signup')->middleware('permission:auth.signup');

        // Fallback
        Route::fallback(fn() => Inertia::render('OtherPage/NotFound'))
            ->name('notfound')->middleware('permission:notfound');

        // ---------- Adminstration ----------
        Route::prefix('adminstration')->group(function () {
            Route::controller(UserController::class)->as('user.')->prefix('users')->group(function () {
                Route::get('/', 'index')->name('list')->middleware('permission:user.list');
                Route::get('/create', 'create')->name('create')->middleware('permission:user.create');
                Route::post('/store', 'store')->name('store')->middleware('permission:user.store');
                Route::get('/{user}/edit', 'edit')->name('edit')->middleware('permission:user.edit');
                Route::put('/{user}', 'update')->name('update')->middleware('permission:user.update');
                Route::delete('/{user}', 'destroy')->name('delete')->middleware('permission:user.delete');
            });

            Route::controller(RoleController::class)->as('role.')->prefix('roles')->group(function () {
                Route::get('/', 'index')->name('list')->middleware('permission:role.list');
                Route::get('/create', 'create')->name('create')->middleware('permission:role.create');
                Route::post('/store', 'store')->name('store')->middleware('permission:role.store');
                Route::get('/{role}/edit', 'edit')->name('edit')->middleware('permission:role.edit');
                Route::put('/{role}', 'update')->name('update')->middleware('permission:role.update');
                Route::delete('/{role}', 'destroy')->name('delete')->middleware('permission:role.delete');
            });
        });

        // ---------- Customers ----------
        Route::controller(CustomersController::class)->as('customer.')->prefix('customers')->group(function () {
            Route::get('/', 'index')->name('index')->middleware('permission:customer.index');
            Route::get('/list', 'list')->name('list')->middleware('permission:customer.list');
            Route::get('/create', 'create')->name('create')->middleware('permission:customer.create');
            Route::post('/store', 'store')->name('store')->middleware('permission:customer.store');
            Route::get('/{customer}/edit', 'edit')->name('edit')->middleware('permission:customer.edit');
            Route::put('/{customer}', 'update')->name('update')->middleware('permission:customer.update');
            Route::delete('/{customer}', 'destroy')->name('delete')->middleware('permission:customer.delete');
        });

        // ---------- Profile ----------
        Route::controller(AdminController::class)->as('admin.profile.')->prefix('profile')->group(function () {
            Route::get('/', 'index')->name('index')->middleware('permission:admin.profile.index');
            Route::get('/edit/{id}', 'edit')->name('edit')->middleware('permission:admin.profile.edit');
            Route::post('/update/{id}', 'update')->name('update')->middleware('permission:admin.profile.update');
        });

        // ---------- Notifications ----------
        Route::controller(NotificationController::class)->as('notification.')->prefix('notifications')->group(function () {
            Route::get('/', 'index')
                ->name('index')
                ->middleware('permission:notification.index');

            Route::get('/fetch', 'fetch')
                ->name('fetch');
            // ->middleware('permission:notification.fetch');

            // ✅ NEW: Mark a single notification as read
            Route::post('/{id}/mark-read', 'markRead')
                ->name('mark-read')
                ->middleware('permission:notification.mark-read');

            // ✅ NEW: Mark all notifications as read
            Route::post('/mark-all-read', 'markAllRead')
                ->name('mark-all-read')
                ->middleware('permission:notification.mark-all-read');
        });

        // ---------- Companies ----------
        Route::controller(CompanyController::class)->as('companies.')->prefix('companies')->group(function () {
            Route::get('/', 'index')->name('index')->middleware('permission:companies.index');
            Route::get('/list', 'list')->name('list')->middleware('permission:companies.list');
            Route::get('/create', 'create')->name('create')->middleware('permission:companies.create');
            Route::post('/store', 'store')->name('store')->middleware('permission:companies.store');
            Route::get('/{company}/edit', 'edit')->name('edit')->middleware('permission:companies.edit');
            Route::put('/{company}', 'update')->name('update')->middleware('permission:companies.update');
            Route::delete('/{id}', 'destroy')->name('destroy')->middleware('permission:companies.destroy');
            Route::patch('/{company}/toggle-status', 'toggleStatus')->name('toggle-status')->middleware('permission:companies.toggle-status');
        });

        // ---------- Company Offices ----------
        Route::controller(CompanyOfficeController::class)->as('companyOffice.')->prefix('company-offices')->group(function () {
            Route::get('/', 'index')->name('index')->middleware('permission:companyOffice.index');
            Route::get('/list', 'list')->name('list')->middleware('permission:companyOffice.list');
            Route::get('/create', 'create')->name('create')->middleware('permission:companyOffice.create');
            Route::post('/store', 'store')->name('store')->middleware('permission:companyOffice.store');
            Route::get('/{companyOffice}/edit', 'edit')->name('edit')->middleware('permission:companyOffice.edit');
            Route::put('/{companyOffice}', 'update')->name('update')->middleware('permission:companyOffice.update');
            Route::delete('/{id}', 'destroy')->name('destroy')->middleware('permission:companyOffice.destroy');
            Route::patch('/{companyOffice}/toggle-status', 'toggleStatus')->name('toggle-status')->middleware('permission:companyOffice.toggle-status');
        });

        // ---------- Company Users ----------
        Route::controller(CompanyUserController::class)->as('companyUser.')->prefix('company-users')->group(function () {
            Route::get('/', 'index')->name('index')->middleware('permission:companyUser.index');
            Route::get('/list', 'list')->name('list')->middleware('permission:companyUser.list');
            Route::get('/create', 'create')->name('create')->middleware('permission:companyUser.create');
            Route::post('/store', 'store')->name('store')->middleware('permission:companyUser.store');
            Route::get('/{companyUser}/edit', 'edit')->name('edit')->middleware('permission:companyUser.edit');
            Route::put('/{companyUser}', 'update')->name('update')->middleware('permission:companyUser.update');
            Route::delete('/{id}', 'destroy')->name('destroy')->middleware('permission:companyUser.destroy');
            Route::patch('/{companyUser}/toggle-status', 'toggleStatus')->name('toggle-status')->middleware('permission:companyUser.toggle-status');
        });

        // ---------- Bookings ----------
        Route::controller(BookingAdminController::class)->as('booking.')->prefix('bookings')->group(function () {
            Route::get('/', 'index')->name('index')->middleware('permission:booking.index');
            Route::get('/list', 'list')->name('list')->middleware('permission:booking.list');
            Route::get('/export-list', 'exportList')->name('exportList')->middleware('permission:booking.export');
            Route::get('/{brn}/applicants/list', 'applicantsList')->name('applicants.list');
            Route::get('/{id}', 'show')->whereNumber('id')->name('show')->middleware('permission:booking.show');
            Route::get('/{id}/edit', 'edit')->whereNumber('id')->name('edit')->middleware('permission:booking.edit');
            Route::post('/{id}/status', 'updateStatus')->whereNumber('id')->name('status')->middleware('permission:booking.status');
            Route::post('/{id}/details/status', 'detailStatus')->whereNumber('id')->name('detailStatus');
            Route::post('/{id}/details/upload-report', 'uploadReport')->whereNumber('id')->name('uploadReport');
            Route::post('/{id}/details/upload-bill', 'uploadBill')->whereNumber('id')->name('uploadBill');
            Route::delete('/{id}', 'destroy')->whereNumber('id')->name('destroy')->middleware('permission:booking.destroy');
            Route::post('/{id}/details/update-status-only', 'updateDetailsStatus')->whereNumber('id')->name('detailUpdateStatus')->middleware('permission:booking.detailUpdateStatus');
            /**  ✅ NEW ON-HOLD TOGGLE ROUTE  **/
            Route::post('/{id}/toggle-hold', 'toggleHold')->whereNumber('id')->name('toggleHold')->middleware('permission:booking.edit');
            Route::post('/details/bulk-update-status', 'bulkUpdateDetailsStatus')->name('details.bulkUpdateStatus')->middleware('permission:booking.detailUpdateStatus');
        });


        /*
        |--------------------------------------------------------------------------
        | SUBSCRIPTIONS (ADMIN) – FUTURE READY
        |--------------------------------------------------------------------------
        */
        Route::prefix('subscriptions')->name('subscriptions.')->controller(SubscriptionController::class)->group(function () {
            Route::get('/', 'index')->name('index')->middleware('permission:subscriptions.index');
            Route::get('/list', 'list')->name('list')->middleware('permission:subscriptions.list');
            Route::get('/create', 'create')->name('create'); // Add button
            Route::get('/{subscriptionPlan}', 'show')->name('show');
            Route::get('/{subscriptionPlan}/edit', 'edit')->name('edit');
            Route::post('/store', 'store')->name('store');
            Route::post('/{subscription}/cancel', 'cancel')->name('cancel')->middleware('permission:subscriptions.cancel');
        });


        // ---------- Settings ----------
        Route::controller(AppSettingsController::class)->as('settings.')->prefix('settings')->group(function () {
            Route::get('/', 'index')->name('index')->middleware('permission:settings.index');
            Route::post('/update', 'update')->name('update')->middleware('permission:settings.update');
        });

        // ---------- FaQs ----------
        // FAQ Category
        Route::controller(FaqCategoryController::class)->as('faq.category.')->prefix('faq.category')->group(function () {
            Route::get('/', 'index')->name('index')->middleware('permission:faq.category.index');
            Route::get('/create', 'create')->name('create')->middleware('permission:faq.category.create');
            Route::post('/store', 'store')->name('store')->middleware('permission:faq.category.store');
            Route::get('/edit/{id}', 'edit')->name('edit')->middleware('permission:faq.category.edit');
            Route::post('/update/{id}', 'update')->name('update')->middleware('permission:faq.category.update');
            Route::delete('/{id}', 'destroy')->name('delete')->middleware('permission:faq.category.delete');
            Route::post('/faq-category/check-sort-order', 'checkSortOrder')->name('checkSortOrder')->middleware('permission:faq.category.check-sort-order');
        });

        // FAQs
        Route::controller(FaqController::class)->as('support.faq.')->prefix('supports/faq')->group(function () {
            Route::get('/', 'index')->name('index')->middleware('permission:support.faq.index');
            Route::get('/list', 'list')->name('list')->middleware('permission:support.faq.list');
            Route::get('/create', 'create')->name('create')->middleware('permission:support.faq.create');
            Route::post('/store', 'store')->name('store')->middleware('permission:support.faq.store');
            Route::get('/edit/{id}', 'edit')->name('edit')->middleware('permission:support.faq.edit');
            Route::post('/update/{id}', 'update')->name('update')->middleware('permission:support.faq.update');
            Route::delete('/{id}', 'destroy')->name('delete')->middleware('permission:support.faq.delete');
            Route::patch('/toggle/{id}', 'toggleStatus')->name('toggle');
            Route::post('/faq/check-sort-order', 'checkSortOrder')->name('checkSortOrder')->middleware('permission:support.faq.check-sort-order');
        });

        // ---------- Support Tickets ----------
        Route::controller(SupportTicketController::class)->as('support.tickets.')->prefix('supports/tickets')->group(function () {
            Route::get('/', 'index')->name('index')->middleware('permission:support.tickets.index');
            Route::get('/list', 'list')->name('list')->middleware('permission:support.tickets.list');
            Route::get('/view/{id}', 'view')->name('view')->middleware('permission:support.tickets.view');

            Route::post('/assign/{id}', 'assign')->name('assign')->middleware('permission:support.tickets.assign');
            Route::post('/status/{id}', 'updateStatus')->name('status')->middleware('permission:support.tickets.status');
            Route::post('/reply/{id}', 'reply')->name('reply')->middleware('permission:support.tickets.reply');

            Route::delete('/delete/{id}', 'delete')->name('delete')->middleware('permission:support.tickets.delete');
            Route::get('/create', 'create')->name('create')->middleware('permission:support.tickets.create');
            Route::post('/store', 'store')->name('store')->middleware('permission:support.tickets.store');
            Route::get('/download-zip/{chat}', 'downloadZip')->name('downloadZip');
        });

        // Support Chats Listing
        Route::controller(SupportChatController::class)->as('support.chats.')->prefix('supports/chats')->group(function () {
            Route::get('/', 'index')->name('index')->middleware('permission:support.chats.index');
            Route::get('/list', 'list')->name('list')->middleware('permission:support.chats.list');
        });
    });
});
