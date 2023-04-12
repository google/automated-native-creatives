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

/**
 * @type {GoogleAppsScript.Spreadsheet.Sheet}
 */
/*const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
  CONFIG.sheets.log.name
);*/

/**
 * Helper class for logging to multiple destinations.
 */
export class MultiLogger {
  private static instance: MultiLogger;
  private readonly sheet: GoogleAppsScript.Spreadsheet.Sheet | null;

  private constructor() {
    this.sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      CONFIG.sheets.log.name
    );
  }

  /**
   * Clear log sheet.
   */
  clear() {
    this.sheet?.clear();
  }

  /**
   * Write log message to log sheet and stdout
   *
   * @param {Array<string | number | Object>} messages
   */
  log(...messages: Array<string | number | Object>) {
    const msg = messages.join(' ');
    Logger.log(msg);
    this.sheet?.appendRow([JSON.stringify(msg)]);
  }

  /**
   * Returns the MultiLogger instance, initializing it if it does not exist yet.
   *
   * @returns {!MultiLogger} The initialized MultiLogger instance
   */
  static getInstance() {
    if (typeof this.instance === 'undefined') {
      this.instance = new MultiLogger();
    }

    return this.instance;
  }
}
