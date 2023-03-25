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

export const CONFIG = {
  headlineMaxLength: 25,
  bodyMaxLength: 90,
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
        driveFolderId: {
          row: 5,
          col: 2,
        },
      },
    },
    feed: {
      name: 'Feed',
      columns: {
        status: 0,
        name: 1,
        headline: 2,
        body: 3,
        url: 4,
        asset: 5,
        filename: 6,
        width: 7,
        height: 8,
        callToAction: 9,
        creativeId: 10,
        lineItemId: 11,
        remove: 12,
        hash: 13,
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
