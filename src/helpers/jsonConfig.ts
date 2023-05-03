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
import { CONFIG } from '../config';
import { DriveHelper } from './drive';
import { SheetsService } from './sheets';

/**
 * This is required to avoid treeshaking this file.
 * As long as anything from a file is being used, the entire file
 * is being kept.
 * The workaround is necessary to achieve a modular codebase
 * because rollup does not realize functions
 * being called from onOpen() for example.
 */
export const keepJsonConfig = null;

/**
 * Load feed config JSON from Drive.
 *
 * @returns {string[]}
 */
function loadFeeds() {
  const driveIdentifier = SheetsService.getInstance().getCellValue(
    CONFIG.sheets.config.name,
    CONFIG.sheets.config.fields.driveIdentifier.row,
    CONFIG.sheets.config.fields.driveIdentifier.col
  );

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

/**
 * Fill feed from parsed JSON configs.
 */
export function fillFeed() {
  const feeds = loadFeeds();

  const rows = parseFeed(feeds);

  SheetsService.getInstance().setValuesInDefinedRange(
    CONFIG.sheets.feed.name,
    2,
    1,
    rows
  );
}

/**
 * Parse feed JSON configs into rows.
 *
 * @param {Record<string, string>[][]} feeds
 * @returns {string[][]}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseFeed(feeds: Record<string, string>[][]): string[][] {
  throw new Error('Function not implemented.');
}
