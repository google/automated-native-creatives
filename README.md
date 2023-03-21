<!--
    Copyright 2023 Google LLC
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
        https://www.apache.org/licenses/LICENSE-2.0
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
 -->

# Automated Native Creatives (ANC)

[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

## Overview

This tool enables efficient management of DV360 Native Site Creatives via a Google Sheets feed

Simply provide the details of the Creatives you want to manage and let ANC handle any updates

## Getting started

1. Create a [Google Cloud](https://console.cloud.google.com) project or re-use an existing one

1. Create an [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
    - Follow the instructions in the setup wizard

1. Enable the following APIs:
    - [Display & Video 360](https://console.cloud.google.com/apis/library/displayvideo.googleapis.com)
    - [Google Drive](https://console.cloud.google.com/apis/library/drive.googleapis.com)

1. Make a copy of the [Template](https://docs.google.com/spreadsheets/d/1amPxTt3LwRTYpnIWK2whGcrYbOs5EICB8Wv5yQG2VMQ)

1. Follow the instructions in the 'How to use' Sheet of the Template

## How to run

You can trigger the tool either manually using the "ANC" Sheets menu or schedule an Apps Script Trigger to call `processFeed()`

## Disclaimer

This is not an officially supported Google product.
