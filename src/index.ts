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

import { CONFIG } from './config';
import { DV360Api } from './helpers/dv360';
import { SheetsService } from './helpers/sheets';
import { MultiLogger } from './util/logger';

let ui: GoogleAppsScript.Base.Ui;

const advertiserId = SheetsService.getInstance().getCellValue(
  CONFIG.sheets.config.name,
  CONFIG.sheets.config.fields.advertiserId.row,
  CONFIG.sheets.config.fields.advertiserId.col
);

/**
 * Add Add-ons menu entry
 */
function onOpen(e: any) {
  getUi()
    .createMenu('ANC')
    .addSubMenu(
      getUi()
        .createMenu('Logo')
        .addItem('Set ID from Creative', 'setLogoAssetIdFromCreative')
        .addItem('Set ID from URL', 'setLogoAssetIdFromUrl')
        .addItem('Set ID from Drive', 'setLogoAssetIdFromDrive')
    )
    .addItem('Process feed', 'processFeed')
    .addItem('Clean up feed', 'cleanupFeed')
    .addToUi();
}

/**
 * Add '...' to string if > maxLength.
 *
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
function stringEllipsis(str: string, maxLength: number) {
  str = str.length > maxLength ? `${str.substring(0, maxLength - 3)}...` : str;

  return str;
}

/**
 * Fetch and set logo asset ID from existing creative.
 */
function setLogoAssetIdFromCreative() {
  const response = getUi().prompt(
    'Set Logo Asset ID',
    'Enter existing Creative ID',
    getUi().ButtonSet.OK_CANCEL
  );

  // Process the user's response
  if (response.getSelectedButton() === getUi().Button.OK) {
    const creative = DV360Api.getInstance().getCreative(
      advertiserId,
      response.getResponseText()
    );

    const logoAsset = creative.assets.find(
      (elem: { role?: any }) =>
        Object.keys(elem).includes('role') && elem.role === 'ASSET_ROLE_ICON'
    );

    // Check if we got an ID
    if (!logoAsset) {
      getUi().alert('Error', 'Failed to fetch Asset ID', getUi().ButtonSet.OK);
      return;
    }

    MultiLogger.getInstance().log(logoAsset);

    // Write Logo Asset ID to Config sheet
    SheetsService.getInstance().setCellValue(
      CONFIG.sheets.config.fields.logoAssetId.row,
      CONFIG.sheets.config.fields.logoAssetId.col,
      logoAsset.asset.mediaId,
      CONFIG.sheets.config.name
    );

    // Indicate success
    getUi().alert(
      'Success',
      `Successfully set Logo Asset ID to ${logoAsset.asset.mediaId}`,
      getUi().ButtonSet.OK
    );
  }
}

/**
 * Fetch and set logo asset ID from public URL.
 */
function setLogoAssetIdFromUrl() {
  const response = getUi().prompt(
    'Set Logo Asset ID',
    'Enter public logo URL',
    getUi().ButtonSet.OK_CANCEL
  );

  // Process the user's response
  if (response.getSelectedButton() !== getUi().Button.OK) {
    return;
  }

  const logoAssetId = DV360Api.getInstance().uploadAssetFromUrl(
    advertiserId,
    response.getResponseText(),
    'asset.jpg'
  );

  // Check if we got an ID
  if (!logoAssetId) {
    getUi().alert('Failed to fetch Asset ID', getUi().ButtonSet.OK);
    return;
  }

  // Write Logo Asset ID to Config sheet
  SheetsService.getInstance().setCellValue(
    CONFIG.sheets.config.fields.logoAssetId.row,
    CONFIG.sheets.config.fields.logoAssetId.col,
    logoAssetId,
    CONFIG.sheets.config.name
  );

  // Indicate success
  getUi().alert(
    'Success',
    `Successfully set Logo Asset ID to ${logoAssetId}`,
    getUi().ButtonSet.OK
  );
}

/**
 * Fetch and set logo asset ID from public URL.
 */
function setLogoAssetIdFromDrive() {
  const response = getUi().prompt(
    'Set Logo Asset ID',
    'Enter Drive File ID',
    getUi().ButtonSet.OK_CANCEL
  );

  // Handle user cancellation
  if (response.getSelectedButton() !== getUi().Button.OK) {
    return;
  }

  // Process the user's response
  const fileId = response.getResponseText();

  const fileBlob = DriveApp.getFileById(fileId).getBlob();

  const logoAssetId = DV360Api.getInstance().uploadAssetFromFile(
    advertiserId,
    fileBlob,
    'asset.jpg'
  );

  // Check if we got an ID
  if (!logoAssetId) {
    getUi().alert('Failed to fetch Asset ID', getUi().ButtonSet.OK);
    return;
  }

  // Write Logo Asset ID to Config sheet
  SheetsService.getInstance().setCellValue(
    CONFIG.sheets.config.fields.logoAssetId.row,
    CONFIG.sheets.config.fields.logoAssetId.col,
    logoAssetId,
    CONFIG.sheets.config.name
  );

  // Indicate success
  getUi().alert(
    'Success',
    `Successfully set Logo Asset ID to ${logoAssetId}`,
    getUi().ButtonSet.OK
  );
}

/**
 * Process Feed.
 */
function processFeed() {
  // First clean up the feed
  cleanupFeed();

  // Get all Feed rows
  const feed = SheetsService.getInstance()
    .getRangeData(CONFIG.sheets.feed.name, 2, 1)
    .filter(row => !row.every(cell => cell === ''));

  feed.forEach((row: string[], index: number) => {
    // Skip empty rows
    if (row === undefined || !row[CONFIG.sheets.feed.columns.name]) {
      return;
    }

    MultiLogger.getInstance().log(`Processing row ${index + 1}`);

    try {
      const hash = hashRow(row);
      const lineItemIds = (row[CONFIG.sheets.feed.columns.lineItemId] as string)
        .replace(/\s/g, '')
        .split(',');

      if (!row[CONFIG.sheets.feed.columns.creativeId]) {
        // Creative is new
        const creativeId = createNativeCreative(row);
        row[CONFIG.sheets.feed.columns.creativeId] = creativeId;

        DV360Api.getInstance().assignCreativeToLineItems(
          advertiserId,
          lineItemIds,
          creativeId
        );
      } else if (row[CONFIG.sheets.feed.columns.hash] !== hash) {
        // Existing creative has been updated
        updateNativeCreative(row);

        DV360Api.getInstance().assignCreativeToLineItems(
          advertiserId,
          lineItemIds,
          row[CONFIG.sheets.feed.columns.creativeId]
        );
      }

      // Set new hash
      row[CONFIG.sheets.feed.columns.hash] = hash;

      // Indicate success
      row[CONFIG.sheets.feed.columns.status] = CONFIG.sheets.feed.enums.success;
    } catch (err: any) {
      MultiLogger.getInstance().log(err);

      // Indicate failure
      row[CONFIG.sheets.feed.columns.status] = CONFIG.sheets.feed.enums.failed;
    } finally {
      // Update row
      SheetsService.getInstance().setValuesInDefinedRange(
        CONFIG.sheets.feed.name,
        index + 2,
        1,
        [row]
      );
    }
  });
}

/**
 * Generate hash of row content
 *
 * @param {string[]} row
 * @returns {string}
 */
function hashRow(row: string[]) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    JSON.stringify(row.slice(2, -1))
  )
    .map(chr => {
      return (chr + 256).toString(16).slice(-2);
    })
    .join('');
}

/**
 * Create new creative.
 *
 * @param {string[]} row
 * @returns {string|null}
 */
function createNativeCreative(row: string[]) {
  // Extract values
  const name = row[CONFIG.sheets.feed.columns.name];
  const headline = row[CONFIG.sheets.feed.columns.headline];
  const body = row[CONFIG.sheets.feed.columns.body];
  const url = row[CONFIG.sheets.feed.columns.url];
  const assetUrl = row[CONFIG.sheets.feed.columns.asset];
  const filename = row[CONFIG.sheets.feed.columns.filename];
  const width = Number(row[CONFIG.sheets.feed.columns.width]);
  const height = Number(row[CONFIG.sheets.feed.columns.height]);
  const callToAction = row[CONFIG.sheets.feed.columns.callToAction];

  MultiLogger.getInstance().log(`Creating creative ${name}`);

  let assetMediaId;

  // Upload Asset
  if (assetUrl.startsWith('https://drive.google.com')) {
    const folderId = DriveHelper.getInstance().extractFolderId(assetUrl);
    const fileBlob = DriveHelper.getInstance().getFileInDriveFolder(
      folderId,
      filename
    );

    assetMediaId = DV360Api.getInstance().uploadAssetFromFile(
      advertiserId,
      fileBlob,
      filename
    );
  } else {
    assetMediaId = DV360Api.getInstance().uploadAssetFromUrl(
      advertiserId,
      assetUrl,
      filename
    );
  }

  MultiLogger.getInstance().log(`Asset ${assetMediaId} uploaded`);

  // Create Creative
  const builtCreative = buildNativeCreative(
    name,
    headline,
    body,
    url,
    assetMediaId,
    width,
    height,
    callToAction
  );
  const uploadedCreative = DV360Api.getInstance().createCreative(
    advertiserId,
    builtCreative
  );

  MultiLogger.getInstance().log(uploadedCreative);

  if (!Object.keys(uploadedCreative).includes('creativeId')) {
    throw new Error('Error creating creative');
  }

  MultiLogger.getInstance().log(
    `Creative ${uploadedCreative.creativeId} created`
  );

  return uploadedCreative.creativeId;
}

/**
 * Remove all rows in 'Feed' set up for removal.
 */
function cleanupFeed() {
  MultiLogger.getInstance().log('Cleaning up...');

  let deleteCorrection = 0;
  let adjustedRowIndex: any;

  const feed = SheetsService.getInstance()
    .getRangeData(CONFIG.sheets.feed.name, 2, 1)
    .filter(row => !row.every(cell => cell === ''));

  feed.forEach((row: string[], index: number) => {
    try {
      if (
        !row.length ||
        !row[CONFIG.sheets.feed.columns.name] ||
        row[CONFIG.sheets.feed.columns.remove] !== 'Remove'
      )
        return;

      adjustedRowIndex = index + 2; // - deleteCorrection;

      MultiLogger.getInstance().log(
        `Pausing ${row[CONFIG.sheets.feed.columns.name]}`
      );

      // Pause Creative in DV360
      DV360Api.getInstance().pauseCreative(
        advertiserId,
        row[CONFIG.sheets.feed.columns.creativeId] as string
      );

      // Unassign Creative from Line Items
      const lineItemIds = (row[CONFIG.sheets.feed.columns.lineItemId] as string)
        .replace(/\s/g, '')
        .split(',');

      DV360Api.getInstance().unassignCreativeFromLineItems(
        advertiserId,
        lineItemIds,
        row[CONFIG.sheets.feed.columns.creativeId]
      );

      // Archive Creative in DV360 (required before deletion)
      //getDV360Api().archiveCreative(advertiserId, row[CONFIG.sheets.feed.columns.creativeId]);

      // Delete Creative from DV360
      //getDV360Api().deleteCreative(advertiserId, row[CONFIG.sheets.feed.columns.creativeId]);

      // Add 1 to adjust for 0-based, 1 for the header and subtract delete correction
      SheetsService.getInstance().clearDefinedRange(
        CONFIG.sheets.feed.name,
        adjustedRowIndex,
        1,
        1,
        0
      );

      deleteCorrection += 1;
    } catch (err: any) {
      MultiLogger.getInstance().log(err);
      row[CONFIG.sheets.feed.columns.status] = CONFIG.sheets.feed.enums.failed;

      SheetsService.getInstance().setValuesInDefinedRange(
        CONFIG.sheets.feed.name,
        adjustedRowIndex,
        1,
        [row]
      );
    }
  });
}

/**
 * Update Native Creative.
 *
 * @param {string[]} row
 * @returns {boolean}
 */
function updateNativeCreative(row: string[]) {
  const creativeId = row[CONFIG.sheets.feed.columns.creativeId];
  const displayName = row[CONFIG.sheets.feed.columns.name];
  const headline = stringEllipsis(
    row[CONFIG.sheets.feed.columns.headline],
    CONFIG.headlineMaxLength
  );
  const body = stringEllipsis(
    row[CONFIG.sheets.feed.columns.body],
    CONFIG.bodyMaxLength
  );
  const cta = row[CONFIG.sheets.feed.columns.callToAction];

  MultiLogger.getInstance().log('Updating creative...');

  // Get creative by ID
  let creative = DV360Api.getInstance().getCreative(advertiserId, creativeId);

  MultiLogger.getInstance().log('Got current live creative');

  // Update mask container
  const updateMask = new Set<string>([]);

  // Delete certain content from assets to avoid 'INVALID_ARGUMENT' error
  creative.assets.forEach((elem: { asset: { content?: string } }) => {
    if (elem.asset.content && elem.asset.content.startsWith('/simgad')) {
      delete elem.asset.content;
    }

    return elem;
  });

  // Check for updated display name
  if (displayName && displayName !== creative.displayName) {
    creative.displayName = displayName;
    updateMask.add('displayName');
  }

  // Check for updated headline
  if (headline) {
    creative = updateNativeCreativeAssetContentByRole(
      creative,
      'ASSET_ROLE_HEADLINE',
      headline
    );
    updateMask.add('assets');
  }

  // Check for updated body
  if (body) {
    creative = updateNativeCreativeAssetContentByRole(
      creative,
      'ASSET_ROLE_BODY',
      body
    );
    updateMask.add('assets');
  }

  // Check for updated CTA
  if (cta) {
    creative = updateNativeCreativeAssetContentByRole(
      creative,
      'ASSET_ROLE_CALL_TO_ACTION',
      cta
    );
    updateMask.add('assets');
  }

  const res = DV360Api.getInstance().updateCreative(
    creative,
    Array.from(updateMask).join(',')
  );

  MultiLogger.getInstance().log(res);

  if (!Object.keys(res).includes('error')) {
    MultiLogger.getInstance().log(res.error);
  }

  return res && !Object.keys(res).includes('error');
}

/**
 * Update asset content of Native Creative by role.
 *
 * @param {Object} creative
 * @param {string} role
 * @param {string} content
 * @returns {Object}
 */
function updateNativeCreativeAssetContentByRole(
  creative: { assets: any[] },
  role: string,
  content: any
) {
  // Get index of asset with the role provided
  const index = creative.assets
    .map((asset: { role: any }) => asset.role)
    .indexOf(role);

  // Update content
  creative.assets[index].asset.content = content;

  return creative;
}

/**
 * Build Native Creative.
 *
 * @param {string} displayName
 * @param {string} headline
 * @param {string} body
 * @param {string} url
 * @param {string} mainMediaId
 * @param {number} width
 * @param {number} height
 * @param {string} callToAction
 * @return {Object}
 */
function buildNativeCreative(
  displayName: string,
  headline: string,
  body: string,
  url: string,
  mainMediaId: string,
  width: number,
  height: number,
  callToAction: string
) {
  const captionUrl = SheetsService.getInstance().getCellValue(
    CONFIG.sheets.config.name,
    CONFIG.sheets.config.fields.captionUrl.row,
    CONFIG.sheets.config.fields.captionUrl.col
  );
  const logoAssetId = SheetsService.getInstance().getCellValue(
    CONFIG.sheets.config.name,
    CONFIG.sheets.config.fields.logoAssetId.row,
    CONFIG.sheets.config.fields.logoAssetId.col
  );

  return {
    displayName: displayName,
    entityStatus: 'ENTITY_STATUS_ACTIVE',
    creativeType: 'CREATIVE_TYPE_NATIVE',
    hostingSource: 'HOSTING_SOURCE_HOSTED',
    dimensions: {
      widthPixels: width,
      heightPixels: height,
    },
    assets: [
      {
        asset: {
          mediaId: mainMediaId,
        },
        role: 'ASSET_ROLE_MAIN',
      },
      {
        asset: {
          content: stringEllipsis(headline, CONFIG.headlineMaxLength),
        },
        role: 'ASSET_ROLE_HEADLINE',
      },
      {
        asset: {
          content: stringEllipsis(body, CONFIG.bodyMaxLength),
        },
        role: 'ASSET_ROLE_BODY',
      },
      {
        asset: {
          mediaId: logoAssetId,
        },
        role: 'ASSET_ROLE_ICON',
      },
      {
        asset: {
          content: captionUrl,
        },
        role: 'ASSET_ROLE_CAPTION_URL',
      },
      {
        asset: {
          content: callToAction,
        },
        role: 'ASSET_ROLE_CALL_TO_ACTION',
      },
    ],
    exitEvents: [
      {
        type: 'EXIT_EVENT_TYPE_DEFAULT',
        url: url,
      },
    ],
  };
}

function getUi() {
  if (typeof ui === 'undefined') {
    ui = SpreadsheetApp.getUi();
  }

  return ui;
}
