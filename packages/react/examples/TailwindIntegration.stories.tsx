import { Meta } from '@storybook/react';
import React from 'react';

import MagicBell, { FloatingNotificationInbox } from '../src';

const Component = ({ handleAllRead, onNotificationClick }) => {
  return (
    <div className="max-w-5xl w-screen">
      <nav className="flex items-center justify-between flex-wrap bg-gray-800 p-6">
        <div className="flex-1">
          <a className="text-blue-100 hover:text-white hover:border-white" href="/#">
            Home
          </a>
        </div>
        <div>
          <MagicBell
            apiKey="df24a28e8921181f6c4220fc306ba76701592d21"
            userEmail="josue@magicbell.io"
            theme={{
              header: { borderRadius: '2px' },
              footer: { borderRadius: '2px' },
            }}
          >
            {(props) => (
              <FloatingNotificationInbox
                onNotificationClick={onNotificationClick}
                onAllRead={handleAllRead}
                height={450}
                {...props}
              />
            )}
          </MagicBell>
        </div>
      </nav>
      <div className="bg-gray-100 h-96">
        <h1 className="py-20 text-center text-2xl">Welcome to my site</h1>
      </div>
    </div>
  );
};

const meta: Meta = {
  component: Component,
  argTypes: {
    handleAllRead: { action: 'handleAllRead' },
    onNotificationClick: { action: 'onNotificationClick' },
  },
};

export default meta;

export const Default = {};
