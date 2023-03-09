/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export class ApiHelper {
  baseUrl: string;

  /**
   * Constructor.
   *
   * @param {string} baseUrl
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Call API.
   *
   * @param {string} path
   * @param {string} method
   * @param {Object} body
   * @param {Object} queryParams
   * @returns {Object}
   */
  callApi(
    path: string,
    method = 'get',
    body?: Object | null,
    queryParams?: Object | null,
    contentType = 'application/json'
  ) {
    let url = path.startsWith('http') ? path : `${this.baseUrl}/${path}`;

    if (queryParams) {
      url = `${url}${this.objectToUrlQuery(url, queryParams)}`;
    }

    const headers = {
      Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
    };

    const params: {
      headers: GoogleAppsScript.URL_Fetch.HttpHeaders;
      method: GoogleAppsScript.URL_Fetch.HttpMethod;
      muteHttpExceptions: boolean;
      contentType?: string;
      payload: Object;
    } = {
      headers,
      method: method as GoogleAppsScript.URL_Fetch.HttpMethod,
      muteHttpExceptions: true,
      payload: {},
    };

    // Only add contentType if there is any
    // because "contentType = ''" would break file upload
    if (contentType) {
      params.contentType = contentType;
    }

    // Add body if any
    if (body) {
      // Stringify JSON if applicable
      if (contentType === 'application/json') {
        body = JSON.stringify(body);
      }

      params.payload = body;
    }

    const res = UrlFetchApp.fetch(url, params).getContentText();

    return JSON.parse(res);
  }

  /**
   * Convert object into URL query string.
   *
   * @param {string} url
   * @param {Object|null} obj
   * @returns {string}
   */
  objectToUrlQuery(url: string, obj?: object) {
    if (!obj || (obj && Object.keys(obj).length === 0)) return '';

    const prefix = url.includes('?') ? '&' : '?';

    return prefix.concat(
      Object.keys(obj)
        .map((key) => {
          if ((obj as any)[key] instanceof Array) {
            const joined = (obj as any)[key].join(`&${key}=`);
            return joined.length ? `${key}=${joined}` : null;
          }
          return `${key}=${(obj as any)[key]}`;
        })
        .filter((param) => param)
        .join('&')
    );
  }
}
