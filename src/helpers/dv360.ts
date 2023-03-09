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

import { ApiHelper } from '../util/api-base';
import { MultiLogger } from '../util/logger';

interface Creative {
  creativeId: string;
  advertiserId: string;
}

interface LineItem {
  lineItemId: string;
  advertiserId: string;
}

/**
 * Helper class to wrap calls to DV360 API.
 */

export class DV360Api extends ApiHelper {
  /**
   * Constructor.
   */
  constructor() {
    super('https://displayvideo.googleapis.com/v1');
  }

  /**
   * Turn Line Items on/off.
   *
   * @param {string} advertiserId
   * @param {string} lineItemId
   * @param {boolean} turnOnOff
   */
  toggleLineItem(advertiserId: string, lineItemId: string, turnOnOff: boolean) {
    const newStatus = turnOnOff
      ? 'ENTITY_STATUS_ACTIVE'
      : 'ENTITY_STATUS_PAUSED';

    const path = `advertisers/${advertiserId}/lineItems/${lineItemId}`;

    const queryParams = {
      updateMask: {
        entityStatus: newStatus,
      },
    };

    this.callApi(path, 'patch', null, queryParams);
  }

  /**
   * List all creatives.
   *
   * @param {string} advertiserid
   * @param {Object} filter
   */
  listCreatives(advertiserId: string, filter: Object) {
    const path = `advertisers/${advertiserId}/creatives`;

    return this.callApi(path, 'get', null, filter);
  }

  /**
   * Get single Creative by ID.
   *
   * @param {string} advertiserId
   * @param {string} creativeId
   * @returns {Object}
   */
  getLineItem(advertiserId: string, lineItemId: string) {
    const path = `advertisers/${advertiserId}/lineItems/${lineItemId}`;

    return this.callApi(path);
  }

  /**
   * Get single Creative by ID.
   *
   * @param {string} advertiserId
   * @param {string} creativeId
   * @returns {Object}
   */
  getCreative(advertiserId: string, creativeId: string) {
    const path = `advertisers/${advertiserId}/creatives/${creativeId}`;

    return this.callApi(path);
  }

  /**
   * Create Creative.
   *
   * @param {string} advertiserId
   * @param {Object} creative
   * @returns {Object}
   */
  createCreative(advertiserId: string, creative: Object) {
    return this.callApi(
      `advertisers/${advertiserId}/creatives`,
      'post',
      creative
    );
  }

  /**
   * Update Creative.
   *
   * @param {Object} creative
   * @param {Object} updateMask
   * @returns {Object}
   */
  updateCreative(creative: Creative, updateMask: Object) {
    const path = `advertisers/${creative.advertiserId}/creatives/${creative.creativeId}`;

    const queryParams = {
      updateMask,
    };

    return this.callApi(path, 'patch', creative, queryParams);
  }

  /**
   * Pause Creative.
   *
   * @param {string} advertiserId
   * @param {string} creativeId
   * @returns {Object}
   */
  pauseCreative(advertiserId: string, creativeId: string) {
    const path = `advertisers/${advertiserId}/creatives/${creativeId}`;

    const creative = {
      creativeId,
      entityStatus: 'ENTITY_STATUS_PAUSED',
    };

    const queryParams = {
      updateMask: 'entityStatus',
    };

    return this.callApi(path, 'patch', creative, queryParams);
  }

  /**
   * Archive Creative.
   *
   * @param {string} advertiserId
   * @param {string} creativeId
   * @returns {Object}
   */
  archiveCreative(advertiserId: string, creativeId: string) {
    const path = `advertisers/${advertiserId}/creatives/${creativeId}`;

    const creative = {
      creativeId,
      entityStatus: 'ENTITY_STATUS_ARCHIVED',
    };

    const queryParams = {
      updateMask: 'entityStatus',
    };

    return this.callApi(path, 'patch', creative, queryParams);
  }

  /**
   * Delete Creative.
   *
   * @param {string} advertiserId
   * @param {string} creativeId
   * @returns {Object}
   */
  deleteCreative(advertiserId: string, creativeId: string) {
    const path = `advertisers/${advertiserId}/creatives/${creativeId}`;

    return this.callApi(path, 'delete');
  }

  /**
   * Update Line Item.
   *
   * @param {Object} lineItem
   * @returns {Object}
   */
  updateLineItem(lineItem: LineItem) {
    const path = `advertisers/${lineItem.advertiserId}/lineItems/${lineItem.lineItemId}`;

    const queryParams = {
      updateMask: 'creativeIds',
    };

    const res = this.callApi(path, 'patch', lineItem, queryParams);

    if (Object.keys(res).includes('error')) {
      throw res.error.message;
    }

    return res;
  }

  /**
   * Upload Asset from URL.
   *
   * @param {string} advertiserId
   * @param {string} url
   * @param {string} filename
   * @return {string} Asset Media ID
   */
  uploadAssetFromUrlOld(advertiserId: string, url: string, filename: string) {
    // Download asset from URL
    const response = UrlFetchApp.fetch(url);
    console.log(response.getResponseCode());
    console.log(response.getContentText());
    const fileBlob = response.getBlob();
    /*const fileBlob = Drive!.Files!.get('1x18hxpOaMPjc4pFi0hWtMw0YfsW7dWsC', {
      alt: 'media',
    });*/

    //const file = DriveApp.getFileById('1x18hxpOaMPjc4pFi0hWtMw0YfsW7dWsC');
    //const fileBlob = file.getBlob();

    //console.log('fileBlob', fileBlob);

    const formData = {
      file: fileBlob,
    };

    // Upload asset as multipart form data
    const path = `https://displayvideo.googleapis.com/upload/v2/advertisers/${advertiserId}/assets`;

    const queryParams = {
      filename,
    };

    const res = this.callApi(path, 'post', formData, queryParams);

    console.log('res', JSON.stringify(res));

    return res.asset.mediaId;
  }

  /**
   * Upload Asset from URL.
   *
   * @param {string} advertiserId
   * @param {string} url
   * @param {string} filename
   * @return {string} Asset Media ID
   */
  uploadAssetFromUrl(advertiserId: string, url: string, filename: string) {
    // Download asset from URL
    const response = UrlFetchApp.fetch(url);
    const fileBlob = response.getBlob();

    return this.uploadAssetFromFile(advertiserId, fileBlob, filename);
  }

  /**
   * Upload Asset from File.
   *
   * @param {string} advertiserId
   * @param {string} file
   * @param {string} filename
   * @return {string} Asset Media ID
   */
  uploadAssetFromFile(advertiserId: string, file: any, filename: string) {
    const formData = {
      file,
    };

    // Upload asset as multipart form data
    const path = `https://displayvideo.googleapis.com/upload/v1/advertisers/${advertiserId}/assets`;

    const queryParams = {
      filename,
    };

    const res = this.callApi(path, 'post', formData, queryParams, '');

    MultiLogger.log(JSON.stringify(res));

    return res.asset.mediaId;
  }
}
