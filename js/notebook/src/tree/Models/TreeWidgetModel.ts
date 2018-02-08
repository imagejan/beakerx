/*
 *  Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import BeakerXApi from "../Utils/BeakerXApi";
import IJVMOptions from "../Types/IJVMOptions";
import IUIOptions from "../Types/IUIOptions";
import IApiSettingsResponse from "../Types/IApiSettingsResponse";
import JVMOptionsModel from "./JVMOptionsModel";
import UIOptionsModel from "./UIOptionsModel";
import DefaultOptionsModel from "./DefaultOptionsModel";
import SyncIndicatorWidget from "../Widgets/SyncIndicatorWidget";

export default class TreeWidgetModel {

  private _options: IApiSettingsResponse;
  private readonly DEFAULT_CONFIG = {
    jvm_options: {
      heap_GB: null,
      other: [],
      properties: []
    },
    ui_options: {
      auto_close: false,
      improve_fonts: true,
      wide_cells: true,
      show_publication: true
    },
    version: 2
  };

  constructor(
    private api: BeakerXApi,
    private jvmOptionsModel: JVMOptionsModel,
    private uiOptionsModel: UIOptionsModel,
    private syncWidget: SyncIndicatorWidget
  ) {
  }

  public load() {
    this.syncStart();
    this.api
      .loadSettings()
      .then((data: IApiSettingsResponse) => {
        if (!data.ui_options) {
          data.ui_options = this.DEFAULT_CONFIG.ui_options;
        }

        this._options = data;

        this.jvmOptionsModel
          .update(data.jvm_options);
        if (!!this.uiOptionsModel) {
          this.uiOptionsModel
            .update(data.ui_options);
        }

        this.showResult(data.jvm_options);

        setTimeout(() => {
          this.syncEnd()
        },1000);
      });

  }

  public save() {
    this.syncStart();

    let payload: IApiSettingsResponse = this.DEFAULT_CONFIG;

    payload.jvm_options.heap_GB = this._options.jvm_options.heap_GB;
    payload.jvm_options.other = this._options.jvm_options.other;
    payload.jvm_options.properties = this._options.jvm_options.properties;

    payload.ui_options.auto_close = this._options.ui_options.auto_close;
    payload.ui_options.improve_fonts = this._options.ui_options.improve_fonts;
    payload.ui_options.wide_cells = this._options.ui_options.wide_cells;
    payload.ui_options.show_publication = this._options.ui_options.show_publication;

    this.showResult(payload.jvm_options);

    this.api.saveSettings({ beakerx:  payload })
      .then(() => {
        setTimeout(() => {
          this.syncEnd()
        },1000);
      });
  }

  public clearErrors() {
    this.syncWidget.clearErrors();
  }

  public showError(error: Error) {
    this.syncWidget.onError(error);
  }

  public setUIOptions(options: IUIOptions) {
    this._options.ui_options = options;
  }

  public setJVMOptions(options: IJVMOptions) {
    this._options.jvm_options = options;
  }

  private syncStart(): void {
    this.syncWidget.onSyncStart();
  }

  private syncEnd(): void {
    this.syncWidget.onSyncEnd();
  }

  private showResult(options: IJVMOptions) {
    this.syncWidget.showResult(this.buildResult(options));
  }

  private buildResult(options: IJVMOptions): string {
    let result: string = '';
    if (options.heap_GB !== null) {
      result += `-Xmx${ DefaultOptionsModel.normaliseHeapSize(options.heap_GB) } `;
    }

    for (let other of options.other) {
      result += `${other} `
    }

    for (let property of options.properties) {
      result += `-D${property.name}=${property.value} `;
    }
    return result;
  };
}
