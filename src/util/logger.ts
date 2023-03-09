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

import { CONFIG } from '../config';

/**
 * @type {GoogleAppsScript.Spreadsheet.Sheet}
 */
const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
  CONFIG.sheets.log.name
);

/**
 * Helper class for logging to multiple destinations.
 */
export class MultiLogger {
  /**
   * Clear log sheet.
   */
  static clear() {
    logSheet!.clear();
  }

  /**
   * Write log message to log sheet and stdout
   *
   * @param {Array<unknown>} messages
   */
  static log(...messages: Array<string | number | object>) {
    messages.forEach((msg) => {
      // Write to log sheet
      logSheet!.appendRow([JSON.stringify(msg)]);

      // Write to stdout
      Logger.log(msg);
    });
  }
}
