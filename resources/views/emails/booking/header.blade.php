<tr>
    <td class="header" style="text-align: center; padding: 20px;">
        <a href="{{ url('/') }}" style="display: inline-block;">

            {{-- <img src="{{ url(optional($app_settings)->application_short_logo ?? 'default/logo.png') }}" class="logo" --}}
            <img src="https://corporate-booking.korpheal.com/default/logo.png" class="logo"
                alt="{{ optional($app_settings)->application_name ?? config('app.name') }}"
                style="max-height: 50px; width: auto; margin-left: 10rem;">

        </a>
    </td>
</tr>
