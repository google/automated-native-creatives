/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
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
  private static instance: DV360Api;

  /**
   * Constructor.
   */
  private constructor() {
    super('https://displayvideo.googleapis.com/v2');
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
  listCreatives(advertiserId: string, filter: Record<string, string>) {
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
  createCreative(advertiserId: string, creative: Object): Creative {
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
  uploadAssetFromUrl(advertiserId: string, url: string, filename: string) {
    // Download asset from URL
    const headers = {
      'x-custom-solution': 'automated-native-creatives',
    };

    const params = {
      muteHttpExceptions: true,
      headers: headers,
      contentType: 'application/json',
    };

    const response = UrlFetchApp.fetch(url, params);

    if (response.getResponseCode() !== 200) {
      throw new Error(
        `Error loading the asset from URL: ${JSON.stringify(
          response.getContentText()
        )}`
      );
    }

    const fileBlob = response.getBlob();

    return this.uploadAssetFromFile(advertiserId, fileBlob, filename);
  }

  /**
   * Upload Asset from File.
   *
   * @param {string} advertiserId
   * @param {GoogleAppsScript.Base.Blob} file
   * @param {string} filename
   * @return {string} Asset Media ID
   */
  uploadAssetFromFile(
    advertiserId: string,
    file: GoogleAppsScript.Base.Blob,
    filename: string
  ) {
    const formData = {
      file,
    };

    // Upload asset as multipart form data
    const path = `https://displayvideo.googleapis.com/upload/v1/advertisers/${advertiserId}/assets`;

    const queryParams = {
      filename,
    };

    const res = this.callApi(path, 'post', formData, queryParams, '');

    MultiLogger.getInstance().log(JSON.stringify(res));

    return res.asset.mediaId;
  }

  /**
   * Get all Native Creatives.
   *
   * @param {string} advertiserId
   * @returns {Object}
   */
  getAllNativeCreatives(advertiserId: string) {
    // Set creative type as filter
    const filter = {
      filter: 'creativeType=CREATIVE_TYPE_NATIVE',
    };

    return this.listCreatives(advertiserId, filter);
  }

  /**
   * Get Creative IDs from Line Items
   *
   * @param {string} advertiserId
   * @param {string} lineItemId
   * @returns {string[]}
   */
  getCreativeIdsFromLineItem(advertiserId: string, lineItemId: string) {
    const lineItem = this.getLineItem(advertiserId, lineItemId);
    const ids = Object.keys(lineItem).includes('creativeIds')
      ? lineItem.creativeIds
      : [];

    return ids;
  }

  /**
   * Assign Creative to Line Items.
   *
   * @param {string} advertiserid
   * @param {string[]} lineItemIds
   * @param {string} creativeId
   */
  assignCreativeToLineItems(
    advertiserId: string,
    lineItemIds: string[],
    creativeId: string
  ) {
    let success = true;

    for (const lineItemId of lineItemIds) {
      const existingCreativeIds = this.getCreativeIdsFromLineItem(
        advertiserId,
        lineItemId
      );
      const lineItem = {
        advertiserId,
        lineItemId,
        creativeIds: existingCreativeIds.concat([creativeId]),
      };

      try {
        Logger.log(`Assigning ${creativeId} to ${lineItemId}`);
        this.updateLineItem(lineItem);
      } catch (err) {
        MultiLogger.getInstance().log(
          `Failed to assign Creative to Line Item: ${err}`
        );
        success = false;
      }
    }

    if (!success) {
      throw new Error('Assigning Creative to at least 1 Line Item failed');
    }
  }

  /**
   * Unassign Creative from Line Item.
   *
   * @param {string} advertiserId
   * @param {string[]} lineItemIds
   * @param {string} creativeId
   */
  unassignCreativeFromLineItems(
    advertiserId: string,
    lineItemIds: string[],
    creativeId: string
  ) {
    let success = true;

    for (const lineItemId of lineItemIds) {
      const originalLineItem = this.getLineItem(advertiserId, lineItemId);
      const lineItem = {
        advertiserId,
        lineItemId,
        creativeIds: originalLineItem.creativeIds.filter(
          (id: string) => id !== creativeId
        ),
      };

      try {
        Logger.log(`Unassigning ${creativeId} from ${lineItemId}`);
        this.updateLineItem(lineItem);
      } catch (err) {
        MultiLogger.getInstance().log(
          `Failed to unassign Creative from Line Item: ${err}`
        );
        success = false;
      }
    }

    if (!success) {
      throw new Error('Unassigning Creative from at least 1 Line Item failed');
    }
  }

  /**
   * Returns the DV360Api instance, initializing it if it does not exist yet.
   *
   * @returns {!DV360Api} The initialized DV360Api instance
   */
  static getInstance() {
    if (typeof this.instance === 'undefined') {
      this.instance = new DV360Api();
    }
    return this.instance;
  }
}
