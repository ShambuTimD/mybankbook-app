<?php

namespace App\Http\Controllers\Auth;


use Illuminate\Http\Request;
use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Writer;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

class TwoFactorController extends Controller
{
    public function setup(Request $request)
    {
        $user = $request->user();
        $google2fa = new Google2FA();

        // Generate new secret
        if (!$user->google2fa_secret) {
            $secret = $google2fa->generateSecretKey();
            $user->google2fa_secret = $secret;
            $user->save();
        } else {
            $secret = $user->google2fa_secret;
        }

        // QR Code
        $qrUrl = $google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        $writer = new Writer(new ImageRenderer(
            new RendererStyle(200),
            new SvgImageBackEnd()
        ));

        $svg = $writer->writeString($qrUrl);

        return Inertia::render('TwoFactor/Setup', [
            'qr' => $svg,
            'secret' => $secret,
            'title' => 'Two-Factor Authentication Setup
'
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate(['code' => 'required|numeric']);
        $user = $request->user();

        $google2fa = new Google2FA();

        $valid = $google2fa->verifyKey($user->google2fa_secret, $request->code);

        if (!$valid) {
            return back()->withErrors(['code' => 'Invalid authentication code']);
        }

        // Optional: Mark 2FA as enabled
        $user->two_factor_confirmed = true;
        $user->save();

        return redirect()->route('dashboard')->with('success', '2FA enabled!');
    }
}
