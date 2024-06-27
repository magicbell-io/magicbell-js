import 'react-app-polyfill/ie11';

import MagicBell, { FloatingNotificationInbox } from '@magicbell/magicbell-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

const customLocale = {
  name: 'en',
  translations: {
    preferences: {
      categories: {
        billing: 'My Billing',
      },
    },
  },
};

function App() {
  return (
    <div id="target">
      <MagicBell
        serverURL="https://api.magicbell.dev"
        apiKey="024b10085bb148d918afe3d92f42b1eba16ad0bd"
        userEmail="stephan@magicbell.io"
        locale={customLocale}
        defaultIsOpen={true}
        stores={[
          { id: 'default', defaultQueryParams: { category: 'billing' } },
          { id: 'other', defaultQueryParams: { topic: 'issue-1' } },
          { id: 'both', defaultQueryParams: { category: 'billing', topic: 'issue-1' } },
        ]}
      >
        {(props) => (
          <FloatingNotificationInbox
            tabs={[
              { storeId: 'default', label: 'default' },
              { storeId: 'other', label: 'other' },
              { storeId: 'both', label: 'both' },
            ]}
            height={450}
            {...props}
            isOpen
          />
        )}
      </MagicBell>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
