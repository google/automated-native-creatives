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
class DriveHelper {
  private static instance: DriveHelper;

  /**
   * Constructor.
   */
  private constructor() {}

  /**
   * Get file based on folder ID and filename.
   *
   * @param {string}folderId
   * @param {string} filename
   * @returns {GoogleAppsScript.Base.Blob}
   */
  getFileInDriveFolder(folderId: string, filename: string) {
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

  /**
   * Extract folder ID from URL or direct ID.
   *
   * @param {string} identifier
   * @returns {string}
   */
  extractFolderId(identifier: string) {
    if (identifier.startsWith('http')) {
      const match = identifier.match(/\/folders\/([\w]*)/);

      if (match && match.length > 1) {
        return match[1];
      }

      throw new Error(`Could not extract folder ID from '${identifier}'`);
    }

    return identifier;
  }

  /**
   * Returns the DriveHelper instance, initializing it if it does not exist yet.
   *
   * @returns {!DriveHelper} The initialized DriveHelper instance
   */
  static getInstance() {
    if (typeof this.instance === 'undefined') {
      this.instance = new DriveHelper();
    }
    return this.instance;
  }
}
