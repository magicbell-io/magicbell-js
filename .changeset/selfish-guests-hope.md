---
'@magicbell/react-headless': major
'playground': major
'magicbell': major
'@magicbell/magicbell-react': major
'@magicbell/cli': major
---

**Breaking Change**!

We've renamed the `categories` property to `category` and the `topics` property to `topic`, to reflect that these properties only support a single value. We haven't been supporting multiple categories or topics for a while now, and believe that renaming this property is the right thing to do. It requires a small change on your end, but the clear naming reduces the number of potential bugs caused by misunderstanding.

If you make use of different stores or tabs using the `categories` or `topics` properties, you'll need to rename them to their singular variants.

```diff
import MagicBell, { FloatingNotificationInbox } from '@magicbell/magicbell-react';
import React from 'react';

const stores = [
  { id: 'default', defaultQueryParams: {} },
  { id: 'unread', defaultQueryParams: { read: false } },
-  { id: 'billing', defaultQueryParams: { categories: ['billing'] } },
+  { id: 'billing', defaultQueryParams: { category: 'billing' } },
-  { id: 'support', defaultQueryParams: { topics: ['support'] } },
+  { id: 'support', defaultQueryParams: { topic: 'support' } },
];

const tabs = [
  { storeId: 'default', label: 'Latest' },
  { storeId: 'unread', label: 'Archive' },
  { storeId: 'billing', label: 'Billing' },
  { storeId: 'support', label: 'Issues' },
];

export default function Index() {
  return (
    <MagicBell
      apiKey="__MAGICBELL_API_KEY__"
      userEmail="__MAGICBELL_USER_EMAIL__"
      userKey="__MAGICBELL_USER_KEY__"
      stores={stores}
      defaultIsOpen
    >
      {(props) => <FloatingNotificationInbox height={450} tabs={tabs} {...props} />}
    </MagicBell>
  );
}
```

Likewise, when you filter notifications using our cli, you might need to change some arguments:

```diff
- magicbell user list notifications --topics support
+ magicbell user list notifications --topic support

- magicbell user notifications mark-all-read --topics billing
+ magicbell user notifications mark-all-read --topic billing

- magicbell user notifications mark-all-seen --topics other
+ magicbell user notifications mark-all-seen --topic other
```
