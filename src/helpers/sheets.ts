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

/**
 * Helper class to wrap spreadsheet actions
 */

export class SheetsService {
  spreadsheet_: GoogleAppsScript.Spreadsheet.Spreadsheet;

  constructor(spreadsheetId = undefined) {
    let spreadsheet;

    if (spreadsheetId) {
      try {
        spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      } catch (e) {
        console.error(e);
        throw new Error(
          `Unable to identify spreadsheet with provided ID: ${spreadsheetId}!`
        );
      }
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    /** @private @const {?SpreadsheetApp.Spreadsheet} */
    this.spreadsheet_ = spreadsheet;
  }

  /**
   * Retrieves a cell's value by the given parameters.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} row The row identifier
   * @param {number} col The column identifier
   * @return {?Object} The value of the cell
   */
  getCellValue(sheetName: string, row: number, col: number) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);

    return sheet ? sheet.getRange(row, col).getValue() : null;
  }

  /**
   * Sets a cell's value by the given parameters.
   *
   * @param {number} row The row identifier
   * @param {number} col The column identifier
   * @param {string} val The value to set
   * @param {?string=} sheetName The name of the sheet to use. Uses the
   *     sheet the user currently has open (active sheet) if not given
   */
  setCellValue(row: number, col: number, val: string, sheetName?: string) {
    const sheet = sheetName
      ? this.getSpreadsheet().getSheetByName(sheetName)
      : this.getSpreadsheet().getActiveSheet();

    if (!sheet) return;

    sheet.getRange(row, col).setValue(val);
  }

  /**
   * Clears the given range in the given sheet.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} row The range's start row
   * @param {number} col The range's start col
   * @param {number=} numRows Optional number of rows to clear. Defaults to
   *     all available rows
   * @param {number=} numCols Optional number of columns to clear. Defaults
   *     to all available columns
   */
  clearDefinedRange(
    sheetName: string,
    row: number,
    col: number,
    numRows = 0,
    numCols = 0
  ) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);

    if (!sheet) return;

    sheet
      .getRange(
        row,
        col,
        numRows || sheet.getLastRow(),
        numCols || sheet.getLastColumn()
      )
      .clear();
  }

  /**
   * Retrieves data from the underlying spreadsheet using the provided range
   * parameters and sheet name.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} startRow The range's start row
   * @param {number} startCol The range's start column
   * @param {number=} numRows Optional number of rows to retrieve. Defaults to
   *     all available rows
   * @param {number=} numCols Optional number of columns to retrieve. Defaults
   *     to all available columns
   * @return {?Array<?Array<?Object>>} The data found at the specified range
   */
  getRangeData(
    sheetName: string,
    startRow: number,
    startCol: number,
    numRows = 0,
    numCols = 0
  ) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);

    // Return empty result if no rows
    if (!sheet || numRows + sheet.getLastRow() - startRow + 1 === 0) {
      return [[]];
    }

    return sheet
      .getRange(
        startRow,
        startCol,
        numRows || sheet.getLastRow() - startRow + 1,
        numCols || sheet.getLastColumn() - startCol + 1
      )
      .getValues();
  }

  /**
   * Writes the given values in the specified sheet and range.
   *
   * @param {string} sheetName The name of the sheet
   * @param {number} row The range's start row
   * @param {number} col The range's start col
   * @param {?Array<?Array<?Object>>} values The values to write
   */
  setValuesInDefinedRange(
    sheetName: string,
    row: number,
    col: number,
    values: Array<Array<Object>>
  ) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);

    if (!sheet) return;

    if (values[0]) {
      sheet
        .getRange(row, col, values.length, values[0].length)
        .setValues(values);
    }
  }

  /**
   * Returns the initialized {@link SpreadsheetApp.Spreadsheet} reference.
   *
   * @return {?SpreadsheetApp.Spreadsheet} The spreadsheet
   */
  getSpreadsheet() {
    return this.spreadsheet_;
  }

  /**
   * Returns the {@link SpreadsheetApp} reference.
   *
   * @return {!Object} The SpreadsheetApp reference
   */
  getSpreadsheetApp() {
    return SpreadsheetApp;
  }
}
