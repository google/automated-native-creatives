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

export interface Column {
  index: number;
  name?: string;
  required?: boolean;
}

export const CONFIG = {
  headlineMaxLength: 25,
  bodyMaxLength: 90,
  ctaMaxLength: 15,
  sheets: {
    config: {
      name: 'Config',
      fields: {
        advertiserId: {
          row: 1,
          col: 2,
        },
        captionUrl: {
          row: 2,
          col: 2,
        },
        logoAssetId: {
          row: 3,
          col: 2,
        },
        driveIdentifier: {
          row: 4,
          col: 2,
        },
        deleteCreativeOnRemove: {
          row: 5,
          col: 2,
        },
      },
    },
    feed: {
      name: 'Feed',
      columns: {
        status: {
          index: 0,
        },
        name: {
          index: 1,
          name: 'Name',
          required: true,
        },
        headline: {
          index: 2,
          name: 'Headline',
          required: true,
        },
        body: {
          index: 3,
          name: 'Body',
          required: true,
        },
        url: {
          index: 4,
          name: 'URL',
          required: true,
        },
        asset: {
          index: 5,
          name: 'Asset',
          required: true,
        },
        filename: {
          index: 6,
          name: 'Filename',
          required: true,
        },
        width: {
          index: 7,
          name: 'Width',
          required: true,
        },
        height: {
          index: 8,
          name: 'Height',
          required: true,
        },
        callToAction: {
          index: 9,
          name: 'Call to Action',
          required: true,
        },
        creativeId: {
          index: 10,
        },
        lineItemId: {
          index: 11,
          name: 'Line Item ID',
          required: true,
        },
        remove: {
          index: 12,
        },
        hash: {
          index: 13,
        },
      },
      enums: {
        success: 'Success',
        failed: 'Failed',
      },
    },
    log: {
      name: 'Log',
    },
  },
};
