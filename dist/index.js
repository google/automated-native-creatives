/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const CONFIG = {
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

class DriveHelper {
    constructor() { }
    getFileInDriveFolder(folderId, filename) {
        const folder = DriveApp.getFolderById(folderId);
        const filesIterator = folder.getFiles();
        while (filesIterator.hasNext()) {
            const file = filesIterator.next();
            if (file.getName() === filename) {
                return file.getBlob();
            }
        }
        throw new Error(`File ${filename} not found in ${folderId}`);
    }
    extractFolderId(identifier) {
        if (identifier.startsWith('http')) {
            const match = identifier.match(/\/folders\/([\w-]*)/);
            if (match && match.length > 1) {
                return match[1];
            }
            throw new Error(`Could not extract folder ID from '${identifier}'`);
        }
        return identifier;
    }
    extractFileId(identifier) {
        if (identifier.startsWith('http')) {
            const match = identifier.match(/\/file\/d\/([\w-]*)/);
            if (match && match.length > 1) {
                return match[1];
            }
            throw new Error(`Could not extract file ID from '${identifier}'`);
        }
        return identifier;
    }
    static getInstance() {
        if (typeof this.instance === 'undefined') {
            this.instance = new DriveHelper();
        }
        return this.instance;
    }
}

class ApiHelper {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    callApi(path, method = 'get', body, queryParams, contentType = 'application/json') {
        let url = path.startsWith('http') ? path : `${this.baseUrl}/${path}`;
        if (queryParams) {
            url = `${url}${this.objectToUrlQuery(url, queryParams)}`;
        }
        const headers = {
            Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
        };
        const params = {
            headers,
            method: method,
            muteHttpExceptions: true,
            payload: {},
        };
        if (contentType) {
            params.contentType = contentType;
        }
        if (body) {
            if (contentType === 'application/json') {
                body = JSON.stringify(body);
            }
            params.payload = body;
        }
        const res = UrlFetchApp.fetch(url, params);
        if (res.getResponseCode() !== 200) {
            throw new Error(`Error calling API: ${res.getResponseCode()} ${res.getContentText()}`);
        }
        return JSON.parse(res.getContentText());
    }
    objectToUrlQuery(url, obj) {
        if (!obj || (obj && Object.keys(obj).length === 0))
            return '';
        const prefix = url.includes('?') ? '&' : '?';
        return prefix.concat(Object.keys(obj)
            .map(key => {
            if (obj[key] instanceof Array) {
                const joined = obj[key].join(`&${key}=`);
                return joined.length ? `${key}=${joined}` : null;
            }
            return `${key}=${obj[key]}`;
        })
            .filter(param => param)
            .join('&'));
    }
}

class MultiLogger {
    constructor() {
        this.sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheets.log.name);
    }
    clear() {
        this.sheet?.clear();
    }
    log(...messages) {
        const msg = messages.join(' ');
        Logger.log(msg);
        this.sheet?.appendRow([JSON.stringify(msg)]);
    }
    static getInstance() {
        if (typeof this.instance === 'undefined') {
            this.instance = new MultiLogger();
        }
        return this.instance;
    }
}

class DV360Api extends ApiHelper {
    constructor() {
        super('https://displayvideo.googleapis.com/v2');
    }
    toggleLineItem(advertiserId, lineItemId, turnOnOff) {
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
    listCreatives(advertiserId, filter) {
        const path = `advertisers/${advertiserId}/creatives`;
        return this.callApi(path, 'get', null, filter);
    }
    getLineItem(advertiserId, lineItemId) {
        const path = `advertisers/${advertiserId}/lineItems/${lineItemId}`;
        return this.callApi(path);
    }
    getCreative(advertiserId, creativeId) {
        const path = `advertisers/${advertiserId}/creatives/${creativeId}`;
        return this.callApi(path);
    }
    createCreative(advertiserId, creative) {
        return this.callApi(`advertisers/${advertiserId}/creatives`, 'post', creative);
    }
    updateCreative(creative, updateMask) {
        const path = `advertisers/${creative.advertiserId}/creatives/${creative.creativeId}`;
        const queryParams = {
            updateMask,
        };
        return this.callApi(path, 'patch', creative, queryParams);
    }
    pauseCreative(advertiserId, creativeId) {
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
    archiveCreative(advertiserId, creativeId) {
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
    deleteCreative(advertiserId, creativeId) {
        const path = `advertisers/${advertiserId}/creatives/${creativeId}`;
        return this.callApi(path, 'delete');
    }
    updateLineItem(lineItem) {
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
    uploadAssetFromUrl(advertiserId, url, filename) {
        const headers = {
            'x-google-apps-script': 'automated-native-creatives',
        };
        const params = {
            muteHttpExceptions: true,
            headers: headers,
            contentType: 'application/json',
        };
        const response = UrlFetchApp.fetch(url, params);
        if (response.getResponseCode() !== 200) {
            throw new Error(`Error loading the asset from URL: ${JSON.stringify(response.getContentText())}`);
        }
        const fileBlob = response.getBlob();
        return this.uploadAssetFromFile(advertiserId, fileBlob, filename);
    }
    uploadAssetFromFile(advertiserId, file, filename) {
        const formData = {
            file,
        };
        const path = `https://displayvideo.googleapis.com/upload/v1/advertisers/${advertiserId}/assets`;
        const queryParams = {
            filename,
        };
        const res = this.callApi(path, 'post', formData, queryParams, '');
        MultiLogger.getInstance().log(JSON.stringify(res));
        return res.asset.mediaId;
    }
    getAllNativeCreatives(advertiserId) {
        const filter = {
            filter: 'creativeType=CREATIVE_TYPE_NATIVE',
        };
        return this.listCreatives(advertiserId, filter);
    }
    getCreativeIdsFromLineItem(advertiserId, lineItemId) {
        const lineItem = this.getLineItem(advertiserId, lineItemId);
        const ids = Object.keys(lineItem).includes('creativeIds')
            ? lineItem.creativeIds
            : [];
        return ids;
    }
    assignCreativeToLineItems(advertiserId, lineItemIds, creativeId) {
        let success = true;
        for (const lineItemId of lineItemIds) {
            const existingCreativeIds = this.getCreativeIdsFromLineItem(advertiserId, lineItemId);
            const lineItem = {
                advertiserId,
                lineItemId,
                creativeIds: existingCreativeIds.concat([creativeId]),
            };
            try {
                Logger.log(`Assigning ${creativeId} to ${lineItemId}`);
                this.updateLineItem(lineItem);
            }
            catch (err) {
                MultiLogger.getInstance().log(`Failed to assign Creative to Line Item: ${err}`);
                success = false;
            }
        }
        if (!success) {
            throw new Error('Assigning Creative to at least 1 Line Item failed');
        }
    }
    unassignCreativeFromLineItems(advertiserId, lineItemIds, creativeId) {
        let success = true;
        for (const lineItemId of lineItemIds) {
            const originalLineItem = this.getLineItem(advertiserId, lineItemId);
            const lineItem = {
                advertiserId,
                lineItemId,
                creativeIds: originalLineItem.creativeIds.filter((id) => id !== creativeId),
            };
            try {
                Logger.log(`Unassigning ${creativeId} from ${lineItemId}`);
                this.updateLineItem(lineItem);
            }
            catch (err) {
                MultiLogger.getInstance().log(`Failed to unassign Creative from Line Item: ${err}`);
                success = false;
            }
        }
        if (!success) {
            throw new Error('Unassigning Creative from at least 1 Line Item failed');
        }
    }
    static getInstance() {
        if (typeof this.instance === 'undefined') {
            this.instance = new DV360Api();
        }
        return this.instance;
    }
}

class SheetsService {
    constructor(spreadsheetId) {
        let spreadsheet;
        if (spreadsheetId) {
            try {
                spreadsheet = SpreadsheetApp.openById(spreadsheetId);
            }
            catch (e) {
                console.error(e);
                throw new Error(`Unable to identify spreadsheet with provided ID: ${spreadsheetId}!`);
            }
        }
        else {
            spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        }
        this.spreadsheet_ = spreadsheet;
    }
    getCellValue(sheetName, row, col) {
        const sheet = this.getSpreadsheet().getSheetByName(sheetName);
        return sheet ? sheet.getRange(row, col).getValue() : null;
    }
    setCellValue(row, col, val, sheetName) {
        const sheet = sheetName
            ? this.getSpreadsheet().getSheetByName(sheetName)
            : this.getSpreadsheet().getActiveSheet();
        if (!sheet)
            return;
        sheet.getRange(row, col).setValue(val);
    }
    clearDefinedRange(sheetName, row, col, numRows = 0, numCols = 0) {
        const sheet = this.getSpreadsheet().getSheetByName(sheetName);
        if (!sheet)
            return;
        sheet
            .getRange(row, col, numRows || sheet.getLastRow(), numCols || sheet.getLastColumn())
            .clear();
    }
    getRangeData(sheetName, startRow, startCol, numRows = 0, numCols = 0) {
        const sheet = this.getSpreadsheet().getSheetByName(sheetName);
        if (!sheet || numRows + sheet.getLastRow() - startRow + 1 === 0) {
            return [[]];
        }
        return sheet
            .getRange(startRow, startCol, numRows || sheet.getLastRow() - startRow + 1, numCols || sheet.getLastColumn() - startCol + 1)
            .getValues();
    }
    setValuesInDefinedRange(sheetName, row, col, values) {
        const sheet = this.getSpreadsheet().getSheetByName(sheetName);
        if (!sheet)
            return;
        if (values[0]) {
            sheet
                .getRange(row, col, values.length, values[0].length)
                .setValues(values);
        }
    }
    getSpreadsheet() {
        return this.spreadsheet_;
    }
    getSpreadsheetApp() {
        return SpreadsheetApp;
    }
    static getInstance(spreadsheetId) {
        if (typeof this.instance === 'undefined') {
            this.instance = new SheetsService(spreadsheetId);
        }
        return this.instance;
    }
}

const keepJsonConfig = null;
function loadFeeds() {
    const driveIdentifier = SheetsService.getInstance().getCellValue(CONFIG.sheets.config.name, CONFIG.sheets.config.fields.driveIdentifier.row, CONFIG.sheets.config.fields.driveIdentifier.col);
    const folderId = DriveHelper.getInstance().extractFolderId(driveIdentifier);
    const folder = DriveApp.getFolderById(folderId);
    const filesIterator = folder.getFilesByType('application/json');
    const configs = [];
    while (filesIterator.hasNext()) {
        const file = filesIterator.next();
        configs.push(JSON.parse(file.getBlob().getDataAsString()));
    }
    return configs;
}
function fillFeed() {
    const feeds = loadFeeds();
    const rows = parseFeed(feeds);
    SheetsService.getInstance().setValuesInDefinedRange(CONFIG.sheets.feed.name, 2, 1, rows);
}
function parseFeed(feeds) {
    throw new Error('Function not implemented.');
}

keepJsonConfig;
let ui;
const advertiserId = SheetsService.getInstance().getCellValue(CONFIG.sheets.config.name, CONFIG.sheets.config.fields.advertiserId.row, CONFIG.sheets.config.fields.advertiserId.col);
MultiLogger.getInstance().clear();
function onOpen() {
    getUi()
        .createMenu('ANC')
        .addSubMenu(getUi()
        .createMenu('Logo')
        .addItem('Set ID from Creative', 'setLogoAssetIdFromCreative')
        .addItem('Set ID from URL', 'setLogoAssetIdFromUrl')
        .addItem('Set ID from Drive', 'setLogoAssetIdFromDrive'))
        .addItem('Fill Feed', 'fillFeed')
        .addItem('Process Feed', 'processFeed')
        .addItem('Clean up Feed', 'cleanupFeed')
        .addToUi();
}
function stringEllipsis(str, maxLength) {
    str = str.length > maxLength ? `${str.substring(0, maxLength - 3)}...` : str;
    return str;
}
function setLogoAssetIdFromCreative() {
    const response = getUi().prompt('Set Logo Asset ID', 'Enter existing Creative ID', getUi().ButtonSet.OK_CANCEL);
    if (response.getSelectedButton() === getUi().Button.OK) {
        const creative = DV360Api.getInstance().getCreative(advertiserId, response.getResponseText());
        const logoAsset = creative.assets.find((elem) => Object.keys(elem).includes('role') && elem.role === 'ASSET_ROLE_ICON');
        if (!logoAsset) {
            getUi().alert('Error', 'Failed to fetch Asset ID', getUi().ButtonSet.OK);
            return;
        }
        MultiLogger.getInstance().log(logoAsset);
        SheetsService.getInstance().setCellValue(CONFIG.sheets.config.fields.logoAssetId.row, CONFIG.sheets.config.fields.logoAssetId.col, logoAsset.asset.mediaId, CONFIG.sheets.config.name);
        getUi().alert('Success', `Successfully set Logo Asset ID to ${logoAsset.asset.mediaId}`, getUi().ButtonSet.OK);
    }
}
function setLogoAssetIdFromUrl() {
    const response = getUi().prompt('Set Logo Asset ID', 'Enter public logo URL', getUi().ButtonSet.OK_CANCEL);
    if (response.getSelectedButton() !== getUi().Button.OK) {
        return;
    }
    const logoAssetId = DV360Api.getInstance().uploadAssetFromUrl(advertiserId, response.getResponseText(), 'asset.jpg');
    if (!logoAssetId) {
        getUi().alert('Failed to fetch Asset ID', getUi().ButtonSet.OK);
        return;
    }
    SheetsService.getInstance().setCellValue(CONFIG.sheets.config.fields.logoAssetId.row, CONFIG.sheets.config.fields.logoAssetId.col, logoAssetId, CONFIG.sheets.config.name);
    getUi().alert('Success', `Successfully set Logo Asset ID to ${logoAssetId}`, getUi().ButtonSet.OK);
}
function setLogoAssetIdFromDrive() {
    const response = getUi().prompt('Set Logo Asset ID', 'Enter Drive File URL or ID', getUi().ButtonSet.OK_CANCEL);
    if (response.getSelectedButton() !== getUi().Button.OK) {
        return;
    }
    const fileId = DriveHelper.getInstance().extractFileId(response.getResponseText());
    const fileBlob = DriveApp.getFileById(fileId).getBlob();
    const logoAssetId = DV360Api.getInstance().uploadAssetFromFile(advertiserId, fileBlob, 'asset.jpg');
    if (!logoAssetId) {
        getUi().alert('Failed to fetch Asset ID', getUi().ButtonSet.OK);
        return;
    }
    SheetsService.getInstance().setCellValue(CONFIG.sheets.config.fields.logoAssetId.row, CONFIG.sheets.config.fields.logoAssetId.col, logoAssetId, CONFIG.sheets.config.name);
    getUi().alert('Success', `Successfully set Logo Asset ID to ${logoAssetId}`, getUi().ButtonSet.OK);
}
function checkRequiredFields(row) {
    const missing = [];
    for (let i = 0; i < row.length; i += 1) {
        const colObj = Object.values(CONFIG.sheets.feed.columns).find(col => col.index === i);
        if (colObj && colObj.required && !row[i]) {
            missing.push(colObj.name);
        }
    }
    if (missing.length > 0) {
        throw new Error(`Please provide missing required fields: ${missing.join(', ')}`);
    }
}
function processFeed() {
    cleanupFeed();
    const feed = SheetsService.getInstance()
        .getRangeData(CONFIG.sheets.feed.name, 2, 1)
        .filter(row => !row.every(cell => cell === ''));
    feed.forEach((row, index) => {
        if (row === undefined || !row[CONFIG.sheets.feed.columns.name.index]) {
            return;
        }
        MultiLogger.getInstance().log(`Processing row ${index + 1}`);
        try {
            checkRequiredFields(row);
            const hash = hashRow(row);
            const lineItemIds = String(row[CONFIG.sheets.feed.columns.lineItemId.index])
                .replace(/\s/g, '')
                .split(',');
            if (!row[CONFIG.sheets.feed.columns.creativeId.index]) {
                const creativeId = createNativeCreative(row);
                row[CONFIG.sheets.feed.columns.creativeId.index] = creativeId;
                MultiLogger.getInstance().log(`Assigning creative ${creativeId} to line items ${lineItemIds.join(',')}`);
                DV360Api.getInstance().assignCreativeToLineItems(advertiserId, lineItemIds, creativeId);
            }
            else if (row[CONFIG.sheets.feed.columns.hash.index] !== hash) {
                updateNativeCreative(row);
                DV360Api.getInstance().assignCreativeToLineItems(advertiserId, lineItemIds, row[CONFIG.sheets.feed.columns.creativeId.index]);
            }
            row[CONFIG.sheets.feed.columns.hash.index] = hash;
            row[CONFIG.sheets.feed.columns.status.index] =
                CONFIG.sheets.feed.enums.success;
        }
        catch (err) {
            const error = err;
            MultiLogger.getInstance().log(`Error: ${error.message}`);
            row[CONFIG.sheets.feed.columns.status.index] =
                CONFIG.sheets.feed.enums.failed;
        }
        finally {
            SheetsService.getInstance().setValuesInDefinedRange(CONFIG.sheets.feed.name, index + 2, 1, [row]);
        }
    });
}
function hashRow(row) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify(row.slice(2, -1)))
        .map(chr => {
        return (chr + 256).toString(16).slice(-2);
    })
        .join('');
}
function createNativeCreative(row) {
    const name = row[CONFIG.sheets.feed.columns.name.index];
    const headline = row[CONFIG.sheets.feed.columns.headline.index];
    const body = row[CONFIG.sheets.feed.columns.body.index];
    let url = row[CONFIG.sheets.feed.columns.url.index];
    const assetUrl = row[CONFIG.sheets.feed.columns.asset.index];
    const filename = row[CONFIG.sheets.feed.columns.filename.index] || 'asset.jpg';
    const width = Number(row[CONFIG.sheets.feed.columns.width.index]) || 1;
    const height = Number(row[CONFIG.sheets.feed.columns.height.index]) || 1;
    const callToAction = row[CONFIG.sheets.feed.columns.callToAction.index];
    if (!url || !width || !height) {
        throw new Error('Please provide all required fields');
    }
    url = url.startsWith('http') ? url : `https://${url}`;
    MultiLogger.getInstance().log(`Creating creative ${name}`);
    let assetMediaId;
    if (assetUrl.startsWith('https://drive.google.com')) {
        const fileId = DriveHelper.getInstance().extractFileId(assetUrl);
        const fileBlob = DriveApp.getFileById(fileId).getBlob();
        assetMediaId = DV360Api.getInstance().uploadAssetFromFile(advertiserId, fileBlob, filename);
    }
    else {
        assetMediaId = DV360Api.getInstance().uploadAssetFromUrl(advertiserId, assetUrl, filename);
    }
    MultiLogger.getInstance().log(`Asset ${assetMediaId} uploaded`);
    const builtCreative = buildNativeCreative(name, headline, body, url, assetMediaId, width, height, callToAction);
    const uploadedCreative = DV360Api.getInstance().createCreative(advertiserId, builtCreative);
    MultiLogger.getInstance().log('uploadedCreative', JSON.stringify(uploadedCreative));
    if (!Object.keys(uploadedCreative).includes('creativeId')) {
        throw new Error('Error creating creative');
    }
    MultiLogger.getInstance().log(`Creative ${uploadedCreative.creativeId} created`);
    return uploadedCreative.creativeId;
}
function cleanupFeed() {
    MultiLogger.getInstance().log('Cleaning up...');
    let deleteCorrection = 0;
    let adjustedRowIndex;
    const deleteCreativeOnRemove = SheetsService.getInstance().getCellValue(CONFIG.sheets.config.name, CONFIG.sheets.config.fields.deleteCreativeOnRemove.row, CONFIG.sheets.config.fields.deleteCreativeOnRemove.col);
    const feed = SheetsService.getInstance()
        .getRangeData(CONFIG.sheets.feed.name, 2, 1)
        .filter(row => !row.every(cell => cell === ''));
    feed.forEach((row, index) => {
        try {
            if (!row.length ||
                !row[CONFIG.sheets.feed.columns.name.index] ||
                row[CONFIG.sheets.feed.columns.remove.index] !== 'Remove')
                return;
            adjustedRowIndex = index + 2 - deleteCorrection;
            MultiLogger.getInstance().log(`Pausing ${row[CONFIG.sheets.feed.columns.name.index]}...`);
            DV360Api.getInstance().pauseCreative(advertiserId, row[CONFIG.sheets.feed.columns.creativeId.index]);
            const lineItemIds = row[CONFIG.sheets.feed.columns.lineItemId.index]
                .replace(/\s/g, '')
                .split(',');
            DV360Api.getInstance().unassignCreativeFromLineItems(advertiserId, lineItemIds, row[CONFIG.sheets.feed.columns.creativeId.index]);
            if (deleteCreativeOnRemove) {
                MultiLogger.getInstance().log(`Deleting ${row[CONFIG.sheets.feed.columns.name.index]}...`);
                DV360Api.getInstance().archiveCreative(advertiserId, row[CONFIG.sheets.feed.columns.creativeId.index]);
                DV360Api.getInstance().deleteCreative(advertiserId, row[CONFIG.sheets.feed.columns.creativeId.index]);
                deleteCorrection += 1;
            }
            SheetsService.getInstance().clearDefinedRange(CONFIG.sheets.feed.name, adjustedRowIndex, 1, 1, 0);
        }
        catch (err) {
            MultiLogger.getInstance().log(err.message);
            row[CONFIG.sheets.feed.columns.status.index] =
                CONFIG.sheets.feed.enums.failed;
            SheetsService.getInstance().setValuesInDefinedRange(CONFIG.sheets.feed.name, adjustedRowIndex, 1, [row]);
        }
    });
}
function updateNativeCreative(row) {
    const creativeId = row[CONFIG.sheets.feed.columns.creativeId.index];
    const displayName = row[CONFIG.sheets.feed.columns.name.index];
    const headline = stringEllipsis(row[CONFIG.sheets.feed.columns.headline.index], CONFIG.headlineMaxLength);
    const body = stringEllipsis(row[CONFIG.sheets.feed.columns.body.index], CONFIG.bodyMaxLength);
    const cta = row[CONFIG.sheets.feed.columns.callToAction.index];
    MultiLogger.getInstance().log('Updating creative...');
    let creative = DV360Api.getInstance().getCreative(advertiserId, creativeId);
    MultiLogger.getInstance().log('Got current live creative');
    const updateMask = new Set([]);
    creative.assets.forEach((elem) => {
        if (elem.asset.content && elem.asset.content.startsWith('/simgad')) {
            delete elem.asset.content;
        }
        return elem;
    });
    if (displayName && displayName !== creative.displayName) {
        creative.displayName = displayName;
        updateMask.add('displayName');
    }
    if (headline) {
        creative = updateNativeCreativeAssetContentByRole(creative, 'ASSET_ROLE_HEADLINE', stringEllipsis(headline, CONFIG.headlineMaxLength));
        updateMask.add('assets');
    }
    if (body) {
        creative = updateNativeCreativeAssetContentByRole(creative, 'ASSET_ROLE_BODY', stringEllipsis(body, CONFIG.bodyMaxLength));
        updateMask.add('assets');
    }
    if (cta) {
        creative = updateNativeCreativeAssetContentByRole(creative, 'ASSET_ROLE_CALL_TO_ACTION', stringEllipsis(cta, CONFIG.ctaMaxLength));
        updateMask.add('assets');
    }
    const res = DV360Api.getInstance().updateCreative(creative, Array.from(updateMask).join(','));
    if (!Object.keys(res).includes('error')) {
        MultiLogger.getInstance().log(res.error);
    }
    return res && !Object.keys(res).includes('error');
}
function updateNativeCreativeAssetContentByRole(creative, role, content) {
    const index = creative.assets
        .map((asset) => asset.role)
        .indexOf(role);
    creative.assets[index].asset.content = content;
    return creative;
}
function buildNativeCreative(displayName, headline, body, url, mainMediaId, width, height, callToAction) {
    const captionUrl = SheetsService.getInstance().getCellValue(CONFIG.sheets.config.name, CONFIG.sheets.config.fields.captionUrl.row, CONFIG.sheets.config.fields.captionUrl.col);
    const logoAssetId = SheetsService.getInstance().getCellValue(CONFIG.sheets.config.name, CONFIG.sheets.config.fields.logoAssetId.row, CONFIG.sheets.config.fields.logoAssetId.col);
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
                    content: stringEllipsis(callToAction, CONFIG.ctaMaxLength),
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
