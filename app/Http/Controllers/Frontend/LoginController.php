<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Customers;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

class LoginController extends Controller
{

    public function customerlogin(Request $request)
    {
        $maxAttempts = 3;                                                          // Maximum attempts allowed
        $decayMinutes = 1;                                                         // Lockout duration in minutes
        $key = 'login-attempts:' . $request->ip();                                 // Unique key based on IP

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {                    // Check if the user is rate-limited
            return response()->json(["", "Too many attempts. Please wait 60 seconds before trying again.", false]);
        }

        $validation = Validator::make($request->all(), [
            'phone' => 'required|numeric',
            'password' => 'required_without:passcode',
            'passcode' => 'required_without:password',
        ]);

        if ($validation->fails()) {
            return response()->json([
                'success' => false,
                'message' => "Validation error",
                'error' => $validation->errors()
            ]);
        }

        $customer = Customers::where("phone_number", $request->phone)->first();


        if (!$customer) {
            RateLimiter::hit($key, $decayMinutes * 60);                             // Increment failed attempt count
            $remainingAttempts = RateLimiter::retriesLeft($key, $maxAttempts);
            return response()->json([
                'success' => false,
                'message' => "Record not matched with our records. Remaining attempts: $remainingAttempts"
            ]);
        }

        if (Hash::check($request->password, $customer->password) || ($request->passcode === $customer->passcode)) {
            RateLimiter::clear($key);                                               // Reset attempts on successful login

            $token = $customer->createToken('Myapp')->plainTextToken;

            $data = Customers::where('phone_number', $request->phone)->first();

            // $data->update(['last_login' => Carbon::now()->format('d-m-Y H:i')]);
            $data['token'] = $token;

            return response()->json([
                'success' => true,
                'message' => "Login Successfully",
                'data' => $data
            ]);
        } else {
            RateLimiter::hit($key, $decayMinutes * 60);                             // Increment failed attempt count
            $remainingAttempts = RateLimiter::retriesLeft($key, $maxAttempts);
            return response()->json([
                'success' => false,
                'message' => "Credential not match. Remaining attempts: $remainingAttempts"
            ]);
        }
    }

    public function logout()
    {
        Auth::user()->tokens->each(function ($token, $key) {
            $token->delete();
        });
        return response()->json([
            'success' => null,
            'message' => "Logout successfully"
        ]);
    }
}
