import { useEffect, useState } from 'react';
import { PreferencesAPI } from '../main/api';

import PreferencesForm from '../components/PreferencesForm';

export default function Preferences() {

	return (
		<div id="preferencesContainer">
			<PreferencesForm />
		</div>
	);

}