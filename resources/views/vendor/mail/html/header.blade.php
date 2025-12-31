@props(['url'])
<tr>
    <td class="header">
        <a href="{{ $url }}" style="display: inline-block;">
            @if (trim($slot) === 'Laravel')
                <img src="{{ asset($app_settins->application_short_logo) }}" class="logo" alt="{{$app_settins->application_name}}">
            @else
                {!! $slot !!}
            @endif
        </a>
    </td>
</tr>
