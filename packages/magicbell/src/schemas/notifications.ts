// This file is generated. Do not update manually!
export const MarkAllReadNotificationsPayloadSchema = {
  title: 'MarkAllReadNotificationsPayloadSchema',
  type: 'object',

  properties: {
    archived: {
      title: 'archived',
      description:
        'A filter on the notifications based on the archived state. Specify false to select unarchived notifications. Defaults to null.',
      type: 'boolean',
    },

    read: {
      title: 'read',
      description:
        'A filter on the notifications based on the read state. Specify false to select unread notifications. Defaults to null.',
      type: 'boolean',
    },

    seen: {
      title: 'seen',
      description:
        'A filter on the notifications based on the seen state. Specify false to select unseen notifications. Defaults to null.',
      type: 'boolean',
    },

    category: {
      title: 'category',
      description:
        'A filter on the notifications based on the category. If you want to get uncategorized notifications, use the "uncategorized" value.',
      type: 'string',
    },

    topic: {
      title: 'topic',
      description: 'A filter on the notifications based on the topic.',
      type: 'string',
    },
  },

  additionalProperties: false,
  required: [],
} as const;

export const MarkAllSeenNotificationsPayloadSchema = {
  title: 'MarkAllSeenNotificationsPayloadSchema',
  type: 'object',

  properties: {
    archived: {
      title: 'archived',
      description:
        'A filter on the notifications based on the archived state. Specify false to select unarchived notifications. Defaults to null.',
      type: 'boolean',
    },

    read: {
      title: 'read',
      description:
        'A filter on the notifications based on the read state. Specify false to select unread notifications. Defaults to null.',
      type: 'boolean',
    },

    seen: {
      title: 'seen',
      description:
        'A filter on the notifications based on the seen state. Specify false to select unseen notifications. Defaults to null.',
      type: 'boolean',
    },

    category: {
      title: 'category',
      description:
        'A filter on the notifications based on the category. If you want to get uncategorized notifications, use the "uncategorized" value.',
      type: 'string',
    },

    topic: {
      title: 'topic',
      description: 'A filter on the notifications based on the topic.',
      type: 'string',
    },
  },

  additionalProperties: false,
  required: [],
} as const;

export const ListNotificationsResponseSchema = {
  title: 'ListNotificationsResponseSchema',
  type: 'object',
  additionalProperties: false,

  properties: {
    project_id: {
      type: 'integer',
      description: 'ID of the MagicBell project these notifications belong to.',
      readOnly: true,
    },

    total: {
      type: 'integer',
      description: 'Total number of notifications for this user.',
      readOnly: true,
    },

    per_page: {
      type: 'integer',
      description: 'Number of notifications per page.',
      readOnly: true,
    },

    total_pages: {
      type: 'integer',
      description: 'Total number of pages.',
      readOnly: true,
    },

    current_page: {
      type: 'integer',
      description: 'Number of the page returned.',
      readOnly: true,
    },

    unseen_count: {
      type: 'integer',
      description: 'Number of unseen notifications. Any filters applied affect this number.',
      readOnly: true,
    },

    unread_count: {
      type: 'integer',
      description: 'Number of unread notifications. Any filters applied affect this number.',
      readOnly: true,
    },

    notifications: {
      type: 'array',
      description: 'List of all notifications in the current page',

      items: {
        type: 'object',
        required: ['title', 'recipient'],
        additionalProperties: false,

        properties: {
          id: {
            type: 'string',
            description: 'The unique id for this notification.',
            readOnly: true,
          },

          title: {
            type: 'string',
            description: 'Title of the notification.',
            nullable: false,
            maxLength: 255,
          },

          content: {
            type: 'string',
            description:
              'Content of the notification. If you provide HTML content, the notification inbox will render it correctly. It should not exceed 4MB.',
            nullable: true,
          },

          action_url: {
            type: 'string',
            format: 'uri',
            description: 'A URL to redirect the user to when they click the notification in their notification inbox.',
            nullable: true,
            maxLength: 2048,
          },

          category: {
            type: 'string',
            description:
              'Category the notification belongs to. This is useful to allow users to set their preferences.',
            nullable: true,
            maxLength: 100,
          },

          topic: {
            type: 'string',
            description: 'Topic the notification belongs to. This is useful to create threads.',
            nullable: true,
            maxLength: 100,
          },

          custom_attributes: {
            type: 'object',
            description:
              'Set of key-value pairs that you can attach to a notification, 6KB at maximum. It accepts objects for the value of a key.\n\nYou can use it to share data between channels or to render a custom UI.',
            nullable: true,
            additionalProperties: true,
          },

          sent_at: {
            type: 'number',
          },

          seen_at: {
            type: 'number',
            nullable: true,
          },

          read_at: {
            type: 'number',
            nullable: true,
          },

          archived_at: {
            type: 'number',
            nullable: true,
          },

          recipient: {
            type: 'object',
            additionalProperties: false,

            properties: {
              id: {
                type: 'string',
                description: 'The unique id for this user.',
                readOnly: true,
              },

              external_id: {
                type: 'string',
                description:
                  "A unique string that MagicBell can utilize to identify the user uniquely. We recommend setting this attribute to the ID of the user in your database. Provide the external id if the user's email is unavailable.",
                maxLength: 255,
                nullable: true,
              },

              email: {
                type: 'string',
                description: "The user's email.",
                maxLength: 255,
                nullable: true,
              },

              first_name: {
                type: 'string',
                description: "The user's first name.",
                maxLength: 50,
                nullable: true,
              },

              last_name: {
                type: 'string',
                description: "The user's last name.",
                maxLength: 50,
                nullable: true,
              },

              custom_attributes: {
                type: 'object',
                description:
                  "Any customer attributes that you'd like to associate with the user. You may want to use these attributes later when writing email templates, for example.",
                additionalProperties: true,
              },

              phone_numbers: {
                type: 'array',
                description: 'An array of phone numbers to use for sending SMS notifications.',
                maxItems: 50,

                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const ListNotificationsPayloadSchema = {
  title: 'ListNotificationsPayloadSchema',
  type: 'object',

  properties: {
    per_page: {
      title: 'per_page',
      description:
        'A limit on the number of notifications to be returned. It can range between 1 and 100, and the default is 15.',
      type: 'integer',
    },

    page: {
      title: 'page',
      description: 'A parameter for use in pagination. Defaults to 1.',
      type: 'integer',
    },

    read: {
      title: 'read',
      description:
        'A filter on the notifications based on the read state. If false, only unread notifications will be returned. Defaults to null.',
      type: 'boolean',
    },

    seen: {
      title: 'seen',
      description:
        'A filter on the notifications based on the seen state. If false, only unseen notifications will be returned. Defaults to null.',
      type: 'boolean',
    },

    archived: {
      title: 'archived',
      description:
        'A filter on the notifications based on the archived state. If false, only unarchived notifications will be returned. Defaults to null.',
      type: 'boolean',
    },

    category: {
      title: 'category',
      description:
        'A filter on the notifications based on the category. If you want to get uncategorized notifications, use the "uncategorized" value.',
      type: 'string',
    },

    topic: {
      title: 'topic',
      description: 'A filter on the notifications based on the topic.',
      type: 'string',
    },
  },

  additionalProperties: false,
  required: [],
} as const;

export const GetNotificationsResponseSchema = {
  title: 'GetNotificationsResponseSchema',
  type: 'object',
  required: ['title', 'recipient'],
  additionalProperties: false,

  properties: {
    id: {
      type: 'string',
      description: 'The unique id for this notification.',
      readOnly: true,
    },

    title: {
      type: 'string',
      description: 'Title of the notification.',
      nullable: false,
      maxLength: 255,
    },

    content: {
      type: 'string',
      description:
        'Content of the notification. If you provide HTML content, the notification inbox will render it correctly. It should not exceed 4MB.',
      nullable: true,
    },

    action_url: {
      type: 'string',
      format: 'uri',
      description: 'A URL to redirect the user to when they click the notification in their notification inbox.',
      nullable: true,
      maxLength: 2048,
    },

    category: {
      type: 'string',
      description: 'Category the notification belongs to. This is useful to allow users to set their preferences.',
      nullable: true,
      maxLength: 100,
    },

    topic: {
      type: 'string',
      description: 'Topic the notification belongs to. This is useful to create threads.',
      nullable: true,
      maxLength: 100,
    },

    custom_attributes: {
      type: 'object',
      description:
        'Set of key-value pairs that you can attach to a notification, 6KB at maximum. It accepts objects for the value of a key.\n\nYou can use it to share data between channels or to render a custom UI.',
      nullable: true,
      additionalProperties: true,
    },

    sent_at: {
      type: 'number',
    },

    seen_at: {
      type: 'number',
      nullable: true,
    },

    read_at: {
      type: 'number',
      nullable: true,
    },

    archived_at: {
      type: 'number',
      nullable: true,
    },

    recipient: {
      type: 'object',
      additionalProperties: false,

      properties: {
        id: {
          type: 'string',
          description: 'The unique id for this user.',
          readOnly: true,
        },

        external_id: {
          type: 'string',
          description:
            "A unique string that MagicBell can utilize to identify the user uniquely. We recommend setting this attribute to the ID of the user in your database. Provide the external id if the user's email is unavailable.",
          maxLength: 255,
          nullable: true,
        },

        email: {
          type: 'string',
          description: "The user's email.",
          maxLength: 255,
          nullable: true,
        },

        first_name: {
          type: 'string',
          description: "The user's first name.",
          maxLength: 50,
          nullable: true,
        },

        last_name: {
          type: 'string',
          description: "The user's last name.",
          maxLength: 50,
          nullable: true,
        },

        custom_attributes: {
          type: 'object',
          description:
            "Any customer attributes that you'd like to associate with the user. You may want to use these attributes later when writing email templates, for example.",
          additionalProperties: true,
        },

        phone_numbers: {
          type: 'array',
          description: 'An array of phone numbers to use for sending SMS notifications.',
          maxItems: 50,

          items: {
            type: 'string',
          },
        },
      },
    },
  },
} as const;
