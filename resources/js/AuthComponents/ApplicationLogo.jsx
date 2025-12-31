import {usePage} from '@inertiajs/react'

export default function ApplicationLogo(props) {
      const { settings } = usePage().props;

    return (
        <img width="200px" src={settings.app_settings.application_short_logo} alt="" />
    );
}
