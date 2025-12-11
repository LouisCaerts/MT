import { useEffect, useState } from 'react';
import { DailyAPI } from '../main/api';

import DailyForm from '../components/DailyForm';

export default function Daily() {

    return (
        <div id="dailyContainer"
                style={{
                    height: "100%"
                }}>
            <DailyForm />
        </div>
    );

}