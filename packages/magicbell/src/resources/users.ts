// This file is generated. Do not update manually!

import { type FromSchema } from 'json-schema-to-ts';

import { Resource } from '../resource';
import * as schemas from '../schemas/users';
import { type RequestOptions } from '../types';

type CreateUsersResponse = FromSchema<typeof schemas.CreateUsersResponseSchema>;
type CreateUsersPayload = FromSchema<typeof schemas.CreateUsersPayloadSchema>;
type UpdateUsersResponse = FromSchema<typeof schemas.UpdateUsersResponseSchema>;
type UpdateUsersPayload = FromSchema<typeof schemas.UpdateUsersPayloadSchema>;
type UpdateByEmailUsersResponse = FromSchema<typeof schemas.UpdateByEmailUsersResponseSchema>;
type UpdateByEmailUsersPayload = FromSchema<typeof schemas.UpdateByEmailUsersPayloadSchema>;
type UpdateByExternalIdUsersResponse = FromSchema<typeof schemas.UpdateByExternalIdUsersResponseSchema>;
type UpdateByExternalIdUsersPayload = FromSchema<typeof schemas.UpdateByExternalIdUsersPayloadSchema>;

export class Users extends Resource {
  path = 'users';
  entity = 'user';

  /**
   * Create a user. Please note that you must provide the user's email or the
   * external id so MagicBell can uniquely identify the user.
   *
   * The external id, if provided, must be unique to the user.
   *
   * @param options - override client request options.
   * @returns
   **/
  create(options?: RequestOptions): Promise<CreateUsersResponse>;

  /**
   * Create a user. Please note that you must provide the user's email or the
   * external id so MagicBell can uniquely identify the user.
   *
   * The external id, if provided, must be unique to the user.
   *
   * @param data
   * @param options - override client request options.
   * @returns
   **/
  create(data: CreateUsersPayload, options?: RequestOptions): Promise<CreateUsersResponse>;

  create(dataOrOptions: CreateUsersPayload | RequestOptions, options?: RequestOptions): Promise<CreateUsersResponse> {
    return this.request(
      {
        method: 'POST',
      },
      dataOrOptions,
      options,
    );
  }

  /**
   * Update a user's data. If you identify users by their email addresses, you need
   * to update the MagicBell data, so this user can still access their notifications.
   *
   * @param userId - The user id is the MagicBell user id. Alternatively, provide an
   *   id like `email:theusersemail@example.com` or `external_id:theusersexternalid` as
   *   the user id.
   * @param options - override client request options.
   * @returns
   **/
  update(userId: string, options?: RequestOptions): Promise<UpdateUsersResponse>;

  /**
   * Update a user's data. If you identify users by their email addresses, you need
   * to update the MagicBell data, so this user can still access their notifications.
   *
   * @param userId - The user id is the MagicBell user id. Alternatively, provide an
   *   id like `email:theusersemail@example.com` or `external_id:theusersexternalid` as
   *   the user id.
   * @param data
   * @param options - override client request options.
   * @returns
   **/
  update(userId: string, data: UpdateUsersPayload, options?: RequestOptions): Promise<UpdateUsersResponse>;

  update(
    userId: string,
    dataOrOptions: UpdateUsersPayload | RequestOptions,
    options?: RequestOptions,
  ): Promise<UpdateUsersResponse> {
    return this.request(
      {
        method: 'PUT',
        path: '{user_id}',
      },
      userId,
      dataOrOptions,
      options,
    );
  }

  /**
   * Immediately deletes a user.
   *
   * @param userId - The user id is the MagicBell user id. Alternatively, provide an
   *   id like `email:theusersemail@example.com` or `external_id:theusersexternalid` as
   *   the user id.
   * @param options - override client request options.
   **/
  delete(userId: string, options?: RequestOptions): Promise<void> {
    return this.request(
      {
        method: 'DELETE',
        path: '{user_id}',
      },
      userId,
      options,
    );
  }

  /**
   * Update a user's data. If you identify users by their email addresses, you need
   * to update the MagicBell data, so this user can still access their notifications.
   *
   * @param userEmail
   * @param options - override client request options.
   * @returns
   **/
  updateByEmail(userEmail: string, options?: RequestOptions): Promise<UpdateByEmailUsersResponse>;

  /**
   * Update a user's data. If you identify users by their email addresses, you need
   * to update the MagicBell data, so this user can still access their notifications.
   *
   * @param userEmail
   * @param data
   * @param options - override client request options.
   * @returns
   **/
  updateByEmail(
    userEmail: string,
    data: UpdateByEmailUsersPayload,
    options?: RequestOptions,
  ): Promise<UpdateByEmailUsersResponse>;

  updateByEmail(
    userEmail: string,
    dataOrOptions: UpdateByEmailUsersPayload | RequestOptions,
    options?: RequestOptions,
  ): Promise<UpdateByEmailUsersResponse> {
    return this.request(
      {
        method: 'PUT',
        path: 'email:{user_email}',
      },
      userEmail,
      dataOrOptions,
      options,
    );
  }

  /**
   * Immediately deletes a user.
   *
   * @param userEmail
   * @param options - override client request options.
   **/
  deleteByEmail(userEmail: string, options?: RequestOptions): Promise<void> {
    return this.request(
      {
        method: 'DELETE',
        path: 'email:{user_email}',
      },
      userEmail,
      options,
    );
  }

  /**
   * Update a user's data. If you identify users by their email addresses, you need
   * to update the MagicBell data, so this user can still access their notifications.
   *
   * @param externalId
   * @param options - override client request options.
   * @returns
   **/
  updateByExternalId(externalId: string, options?: RequestOptions): Promise<UpdateByExternalIdUsersResponse>;

  /**
   * Update a user's data. If you identify users by their email addresses, you need
   * to update the MagicBell data, so this user can still access their notifications.
   *
   * @param externalId
   * @param data
   * @param options - override client request options.
   * @returns
   **/
  updateByExternalId(
    externalId: string,
    data: UpdateByExternalIdUsersPayload,
    options?: RequestOptions,
  ): Promise<UpdateByExternalIdUsersResponse>;

  updateByExternalId(
    externalId: string,
    dataOrOptions: UpdateByExternalIdUsersPayload | RequestOptions,
    options?: RequestOptions,
  ): Promise<UpdateByExternalIdUsersResponse> {
    return this.request(
      {
        method: 'PUT',
        path: 'external_id:{external_id}',
      },
      externalId,
      dataOrOptions,
      options,
    );
  }

  /**
   * Immediately deletes a user.
   *
   * @param externalId
   * @param options - override client request options.
   **/
  deleteByExternalId(externalId: string, options?: RequestOptions): Promise<void> {
    return this.request(
      {
        method: 'DELETE',
        path: 'external_id:{external_id}',
      },
      externalId,
      options,
    );
  }
}
